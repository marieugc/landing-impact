// Fonction Supabase « rappels-bilans » : notifications sur le téléphone des élèves.
// - Dimanche 18 h (heure de Paris) : rappel aux élèves dont le bilan est attendu aujourd'hui et pas encore envoyé.
// - Lundi 9 h : relance des élèves dont le bilan de la semaine n'est pas arrivé.
// Appelée toutes les heures le dimanche et le lundi par pg_cron (voir supabase/rappels.sql) : elle n'envoie
// rien en dehors de ces deux créneaux. Corps { "moment": "test" } : notification d'essai à tous les appareils.
//
// Secrets à créer dans Supabase (Edge Functions › Secrets) : VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY,
// VAPID_SUBJECT (ex. mailto:ton-adresse), RAPPELS_SECRET. SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY
// sont fournis automatiquement par Supabase.
import { envoyerPush, type Abonnement } from './webpush.ts';

const URL_BASE = Deno.env.get('SUPABASE_URL')!;
const CLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const vapid = {
  publicKey: Deno.env.get('VAPID_PUBLIC_KEY') ?? '',
  privateKey: Deno.env.get('VAPID_PRIVATE_KEY') ?? '',
  subject: Deno.env.get('VAPID_SUBJECT') ?? 'mailto:contact@bootyflow.fr'
};

async function rest(chemin: string, options: RequestInit = {}) {
  const r = await fetch(`${URL_BASE}/rest/v1/${chemin}`, {
    ...options,
    headers: { apikey: CLE, Authorization: `Bearer ${CLE}`, 'Content-Type': 'application/json', ...(options.headers ?? {}) }
  });
  if (!r.ok) throw new Error(`${chemin} : ${r.status} ${await r.text()}`);
  return r.status === 204 ? null : r.json();
}

// ── Dates (même règle que l'app : échéance chaque dimanche, sauf jour choisi par la coach) ──
function heureDeParis(maintenant = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23', weekday: 'short'
  }).formatToParts(maintenant).map((x) => [x.type, x.value]));
  const jours = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return { date: `${p.year}-${p.month}-${p.day}`, heure: Number(p.hour), jour: jours.indexOf(p.weekday) };
}
const jourUTC = (d: string) => new Date(`${d}T12:00:00Z`);
function plusJours(d: string, n: number) {
  const x = jourUTC(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
}
const ecartJours = (a: string, b: string) => Math.round((jourUTC(a).getTime() - jourUTC(b).getTime()) / 864e5);
function dimancheApres(d: string, ecart = 0) {
  const debut = plusJours(d, ecart);
  return plusJours(debut, (7 - jourUTC(debut).getUTCDay()) % 7);
}
type Eleve = { id: string; prenom: string | null; prochain_bilan: string | null; created_at: string };
function departBilans(e: Eleve, dates: string[]) {
  if (e.prochain_bilan) return e.prochain_bilan;
  if (dates.length) return dimancheApres([...dates].sort()[0]);
  return dimancheApres(e.created_at.slice(0, 10), 4);
}
// Dernière échéance passée ou du jour (null si la première n'est pas encore arrivée)
function derniereEcheance(depart: string, aujourdhui: string) {
  const n = ecartJours(depart, aujourdhui);
  if (n > 0) return null;
  return plusJours(depart, Math.floor(-n / 7) * 7);
}
// Un bilan envoyé jusqu'à 3 jours avant l'échéance compte (du jeudi au dimanche)
const bilanRecu = (echeance: string, dates: string[]) => dates.some((d) => d >= plusJours(echeance, -3));

const MESSAGES = {
  rappel: (prenom: string) => ({
    titre: 'Ton bilan de la semaine',
    corps: `${prenom ? `${prenom}, pense` : 'Pense'} à envoyer ton bilan ce soir : poids, photos et ton état de la semaine.`,
    url: '#/bilan'
  }),
  retard: (prenom: string) => ({
    titre: 'Bilan pas encore reçu',
    corps: `${prenom ? `${prenom}, ta` : 'Ta'} coach n'a pas reçu ton bilan du week-end. Tu peux encore l'envoyer aujourd'hui.`,
    url: '#/bilan'
  }),
  test: () => ({ titre: 'Booty Flow', corps: 'Les rappels fonctionnent ! Tu seras prévenue pour tes bilans.', url: '#/accueil' })
};

Deno.serve(async (req) => {
  if (req.headers.get('x-rappels-secret') !== Deno.env.get('RAPPELS_SECRET')) {
    return new Response('Accès refusé', { status: 401 });
  }
  if (!vapid.publicKey || !vapid.privateKey) return new Response('Clés VAPID manquantes dans les secrets', { status: 500 });

  const { moment: demande = 'auto' } = await req.json().catch(() => ({}));
  const paris = heureDeParis();
  let moment = demande;
  if (demande === 'auto') {
    if (paris.jour === 0 && paris.heure === 18) moment = 'rappel';
    else if (paris.jour === 1 && paris.heure === 9) moment = 'retard';
    else return Response.json({ moment: 'aucun', paris });
  }
  if (!['rappel', 'retard', 'test'].includes(moment)) return new Response('Moment inconnu', { status: 400 });

  const [eleves, bilans, abonnements] = await Promise.all([
    rest('profiles?role=eq.eleve&select=id,prenom,prochain_bilan,created_at'),
    rest('bilans?select=eleve_id,date'),
    rest('abonnements_push?select=id,eleve_id,endpoint,p256dh,auth')
  ]) as [Eleve[], { eleve_id: string; date: string }[], (Abonnement & { id: string; eleve_id: string })[]];

  // Qui doit recevoir la notification ?
  const cibles = eleves.filter((e) => {
    if (moment === 'test') return true;
    const dates = bilans.filter((b) => b.eleve_id === e.id).map((b) => b.date);
    const echeance = derniereEcheance(departBilans(e, dates), paris.date);
    if (!echeance || bilanRecu(echeance, dates)) return false;
    // Dimanche soir : seulement si le bilan est attendu aujourd'hui ; lundi : échéance passée sans bilan
    return moment === 'rappel' ? echeance === paris.date : echeance < paris.date;
  });

  let envoyes = 0, supprimes = 0, erreurs = 0;
  for (const e of cibles) {
    const message = MESSAGES[moment as keyof typeof MESSAGES](e.prenom ?? '');
    // Test : tous les appareils de l'élève ; sinon idem (une élève peut avoir téléphone + tablette)
    for (const a of abonnements.filter((x) => x.eleve_id === e.id)) {
      try {
        const statut = await envoyerPush(a, message, vapid);
        if (statut === 404 || statut === 410) {
          await rest(`abonnements_push?id=eq.${a.id}`, { method: 'DELETE' });
          supprimes += 1;
        } else if (statut >= 200 && statut < 300) envoyes += 1;
        else erreurs += 1;
      } catch (_) {
        erreurs += 1;
      }
    }
  }
  return Response.json({ moment, paris, eleves_concernees: cibles.length, envoyes, supprimes, erreurs });
});
