// Fonction Supabase « webhook-systemeio » : reçoit les webhooks de Systeme.io (abonnement Booty Flow App).
//
// Adresse à coller dans Systeme.io (Paramètres › Webhooks) :
//   https://<projet>.supabase.co/functions/v1/webhook-systemeio?secret=<SYSTEMEIO_WEBHOOK_SECRET>
// Événements à cocher : « New sale » et « Sale canceled ».
// Dans les réglages de la fonction, désactiver « Verify JWT » (elle est protégée par le jeton secret de l'adresse).
//
// Secrets (Edge Functions › Secrets) :
//   SYSTEMEIO_WEBHOOK_SECRET  jeton secret de l'adresse (obligatoire, long et aléatoire)
//   SYSTEMEIO_OFFER_ID        identifiant(s) de l'offre Booty Flow App, séparés par des virgules (obligatoire)
//   SYSTEMEIO_FILTRE_IP       « oui » (par défaut) : n'accepte que les adresses IP de Systeme.io ; « non » pour les tests
//   SYSTEMEIO_IPS             (facultatif) adresses IP autorisées, par défaut 185.236.142.1,185.236.142.2,185.236.142.3
//   APP_URL                   adresse de l'app, où mène le lien de l'e-mail de bienvenue
// SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournis automatiquement par Supabase.
import { traiter, lireEvenement, lireEmail, type Base, type Profil } from './traitement.ts';

const URL_BASE = Deno.env.get('SUPABASE_URL')!;
const CLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const entetesServeur = { apikey: CLE, Authorization: `Bearer ${CLE}`, 'Content-Type': 'application/json' };

async function rest(chemin: string, options: RequestInit = {}) {
  const r = await fetch(`${URL_BASE}/rest/v1/${chemin}`, { ...options, headers: { ...entetesServeur, ...(options.headers ?? {}) } });
  if (!r.ok) throw new Error(`${chemin.split('?')[0]} : ${r.status} ${await r.text()}`);
  const texte = await r.text();
  return texte ? JSON.parse(texte) : null;
}

const base: Base = {
  async trouverProfil(email) {
    const [p] = await rest(`profiles?email=eq.${encodeURIComponent(email)}&select=*&limit=1`) as Profil[];
    return p ?? null;
  },
  async inviter(email, prenom) {
    // Crée le compte et envoie l'e-mail « Invite user » de Supabase (lien pour créer son mot de passe)
    const appUrl = Deno.env.get('APP_URL');
    const r = await fetch(`${URL_BASE}/auth/v1/invite${appUrl ? `?redirect_to=${encodeURIComponent(appUrl)}` : ''}`, {
      method: 'POST', headers: entetesServeur,
      body: JSON.stringify({ email, data: { prenom: prenom ?? email.split('@')[0] } })
    });
    if (!r.ok) throw new Error(`Création du compte impossible : ${r.status} ${await r.text()}`);
    const u = await r.json();
    if (!u?.id) throw new Error('Création du compte : identifiant manquant');
    return u.id as string;
  },
  async majProfil(id, patch) {
    await rest(`profiles?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(patch), headers: { Prefer: 'return=minimal' } });
  }
};

async function empreinte(texte: string) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texte));
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
// Comparaison à durée constante (le jeton ne peut pas être deviné caractère par caractère)
function egal(a: string, b: string) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
const reponse = (statut: number, corps: Record<string, unknown>) => Response.json(corps, { status: statut });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return reponse(405, { erreur: 'POST uniquement' });

  // 1. Jeton secret dans l'adresse
  const secret = Deno.env.get('SYSTEMEIO_WEBHOOK_SECRET') ?? '';
  const recu = new URL(req.url).searchParams.get('secret') ?? '';
  if (secret.length < 16 || !egal(recu, secret)) return reponse(401, { erreur: 'Accès refusé' });

  const brut = await req.text();
  let contenu: unknown;
  try { contenu = JSON.parse(brut); } catch { contenu = { texte_brut: brut.slice(0, 20000) }; }
  // En-têtes gardés pour le journal (sans rien de secret)
  const entetes: Record<string, string> = {};
  req.headers.forEach((v, k) => { if (!/authorization|apikey|cookie/i.test(k)) entetes[k] = v; });
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || '';
  const evenement = lireEvenement(entetes, contenu);
  const email = lireEmail(contenu);
  const journal = { evenement, email, ip, entetes, contenu };

  // 2. Adresses IP de Systeme.io
  const filtre = (Deno.env.get('SYSTEMEIO_FILTRE_IP') ?? 'oui').toLowerCase() !== 'non';
  const ips = (Deno.env.get('SYSTEMEIO_IPS') ?? '185.236.142.1,185.236.142.2,185.236.142.3').split(',').map((x) => x.trim());
  if (filtre && !ips.includes(ip)) {
    await rest('webhooks_systemeio', { method: 'POST', body: JSON.stringify({
      ...journal, cle: `refuse-${crypto.randomUUID()}`, statut: 'refuse', message: `Adresse IP non autorisée : ${ip || 'inconnue'}`,
      traite_le: new Date().toISOString()
    }), headers: { Prefer: 'return=minimal' } }).catch(() => {});
    return reponse(403, { erreur: 'Adresse IP non autorisée' });
  }

  // 3. Journal + anti-doublon : un contenu identique déjà traité n'est jamais rejoué
  const cle = await empreinte(brut);
  let ligne: { id: string; statut: string } | undefined;
  try {
    [ligne] = await rest('webhooks_systemeio?on_conflict=cle', {
      method: 'POST', body: JSON.stringify({ ...journal, cle }),
      headers: { Prefer: 'resolution=ignore-duplicates,return=representation' }
    });
  } catch (e) {
    return reponse(500, { erreur: `Journal impossible : ${(e as Error).message}` });
  }
  if (!ligne) {
    const [deja] = await rest(`webhooks_systemeio?cle=eq.${cle}&select=id,statut`);
    // Déjà traité, ignoré ou en cours : on répond OK sans rien refaire. Une erreur précédente est retentée.
    if (!deja || deja.statut !== 'erreur') return reponse(200, { ok: true, doublon: true });
    ligne = deja;
  }

  // 4. Traitement
  const offresApp = (Deno.env.get('SYSTEMEIO_OFFER_ID') ?? '').split(',').map((x) => x.trim()).filter(Boolean);
  let resultat;
  try {
    resultat = await traiter(evenement, contenu, base, { offresApp });
  } catch (e) {
    resultat = { statut: 'erreur' as const, message: (e as Error).message.slice(0, 1000) };
  }
  await rest(`webhooks_systemeio?id=eq.${ligne!.id}`, {
    method: 'PATCH', headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ statut: resultat.statut, message: resultat.message, profil_id: resultat.profil_id ?? null, traite_le: new Date().toISOString() })
  }).catch(() => {});

  // Une erreur renvoie 500 : Systeme.io peut renvoyer le webhook, qui sera retraité
  return reponse(resultat.statut === 'erreur' ? 500 : 200, { ok: resultat.statut !== 'erreur', ...resultat });
});
