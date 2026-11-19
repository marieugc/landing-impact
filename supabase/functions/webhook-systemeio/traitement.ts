// Traitement des webhooks Systeme.io (sans accès réseau : testé par supabase/tests/webhook-systemeio.test.ts).
// La structure exacte des données de Systeme.io n'étant pas documentée en détail, la lecture est volontairement
// tolérante : e-mail, prénom, offre et date sont cherchés à plusieurs endroits possibles. Le contenu brut de chaque
// webhook est gardé dans la table webhooks_systemeio pour vérifier et ajuster si besoin.

export type Formule = 'personnalise' | 'autonomie' | 'app';
export type Statut = 'actif' | 'resilie' | 'expire';
export type Profil = {
  id: string;
  email: string | null;
  prenom?: string | null;
  role: string;
  formule?: Formule;
  statut_abonnement?: Statut;
  compte_valide?: boolean;
  fin_acces?: string | null;
  dernier_paiement?: string | null;
};
// Ce dont le traitement a besoin pour lire et écrire les comptes
export interface Base {
  trouverProfil(email: string): Promise<Profil | null>;
  // Crée le compte et envoie l'e-mail de bienvenue avec le lien pour créer son mot de passe. Renvoie l'identifiant.
  inviter(email: string, prenom: string | null): Promise<string>;
  majProfil(id: string, patch: Partial<Profil> & Record<string, unknown>): Promise<void>;
}
export type Evenement = 'vente' | 'annulation' | 'inconnu';
export type Resultat = { statut: 'traite' | 'ignore' | 'erreur'; message: string; profil_id?: string; email?: string | null };

type Json = unknown;
const estObjet = (v: Json): v is Record<string, Json> => !!v && typeof v === 'object' && !Array.isArray(v);

// ── Lecture des données ──

// « New sale » / « Sale canceled » : dans l'en-tête X-Webhook-Event ou dans le contenu (type, event…)
export function lireEvenement(entetes: Record<string, string>, corps: Json): Evenement {
  const candidats = [
    entetes['x-webhook-event'], entetes['x-systemeio-event'], entetes['x-event'],
    ...(estObjet(corps) ? [corps.type, corps.event, corps.event_type, corps.eventType, corps.name] : [])
  ];
  for (const c of candidats) {
    if (typeof c !== 'string') continue;
    const t = c.toUpperCase().replace(/[^A-Z]/g, '');
    if (t.includes('CANCEL')) return 'annulation';
    if (t.includes('SALE') && t.includes('NEW')) return 'vente';
  }
  return 'inconnu';
}

// Parcourt tout le contenu : [clé, valeur, chemin des clés parentes]
function* parcourir(v: Json, chemin: string[] = []): Generator<[string, Json, string[]]> {
  if (Array.isArray(v)) { for (const x of v) yield* parcourir(x, chemin); return; }
  if (!estObjet(v)) return;
  for (const [k, x] of Object.entries(v)) {
    yield [k, x, chemin];
    yield* parcourir(x, [...chemin, k]);
  }
}
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function lireEmail(corps: Json): string | null {
  let secours: string | null = null;
  for (const [k, v, chemin] of parcourir(corps)) {
    if (!/^e?mail$|^email_?address$/i.test(k) || typeof v !== 'string' || !EMAIL.test(v.trim())) continue;
    // L'e-mail de la cliente (customer / contact) passe avant tout autre e-mail (vendeur, affilié…)
    if (chemin.some((c) => /customer|contact|buyer|client/i.test(c))) return v.trim().toLowerCase();
    secours ??= v.trim().toLowerCase();
  }
  return secours;
}

export function lirePrenom(corps: Json): string | null {
  for (const [k, v] of parcourir(corps)) {
    if (typeof v === 'string' && v.trim() && /^(first_?name|firstname|prenom)$/i.test(k)) return v.trim().slice(0, 60);
  }
  // Champs de contact Systeme.io sous forme de liste : { slug: "first_name", value: "Camille" }
  for (const [, v] of parcourir(corps)) {
    if (estObjet(v) && v.slug === 'first_name' && typeof v.value === 'string' && v.value.trim()) return v.value.trim().slice(0, 60);
  }
  return null;
}

// Identifiants de l'offre / du prix : tout « id » rangé sous une clé offer, price_plan, product…,
// et les champs offer_id, price_plan_id…
export function lireOffres(corps: Json): string[] {
  const ids = new Set<string>();
  const offre = /offer|price_?plan|priceplan|product|produit/i;
  for (const [k, v, chemin] of parcourir(corps)) {
    if (typeof v !== 'string' && typeof v !== 'number') continue;
    if ((k === 'id' && chemin.length && offre.test(chemin[chemin.length - 1])) || (offre.test(k) && /_?id$/i.test(k))) ids.add(String(v));
  }
  return [...ids];
}

// Date du paiement (commande) ; à défaut, maintenant
export function lireDatePaiement(corps: Json, maintenant: Date): Date {
  const cles = /^(created_?at|paid_?at|payment_?date|date|createdat)$/i;
  for (const [k, v, chemin] of parcourir(corps)) {
    if (!cles.test(k) || typeof v !== 'string') continue;
    if (chemin.length && !/order|sale|payment|transaction|data/i.test(chemin[chemin.length - 1])) continue;
    const d = new Date(v);
    // Une date absurde (invalide, dans le futur, ou de plus de 40 jours) est ignorée
    if (!Number.isNaN(d.getTime()) && d.getTime() <= maintenant.getTime() + 864e5 && d.getTime() >= maintenant.getTime() - 40 * 864e5) return d;
  }
  return maintenant;
}

// +1 mois, en restant sur le dernier jour du mois si besoin (31 janvier → 28 ou 29 février)
export function plusUnMois(d: Date): Date {
  const r = new Date(d.getTime());
  const jour = r.getUTCDate();
  r.setUTCDate(1);
  r.setUTCMonth(r.getUTCMonth() + 1);
  const dernier = new Date(Date.UTC(r.getUTCFullYear(), r.getUTCMonth() + 1, 0)).getUTCDate();
  r.setUTCDate(Math.min(jour, dernier));
  return r;
}
const plusTard = (a: string | null | undefined, b: Date) => (a && new Date(a).getTime() > b.getTime() ? new Date(a) : b);

// ── Traitement ──

export async function traiter(
  evenement: Evenement, corps: Json, base: Base,
  { offresApp, maintenant = new Date() }: { offresApp: string[]; maintenant?: Date }
): Promise<Resultat> {
  const email = lireEmail(corps);
  if (evenement === 'inconnu') return { statut: 'ignore', message: 'Événement non géré (ni « New sale » ni « Sale canceled »)', email };
  if (!email) return { statut: 'erreur', message: 'Adresse e-mail introuvable dans le webhook', email };
  const offres = lireOffres(corps);
  const estOffreApp = offres.some((id) => offresApp.includes(id));

  if (evenement === 'vente') {
    if (!offresApp.length) return { statut: 'erreur', message: 'SYSTEMEIO_OFFER_ID n\'est pas réglé dans les secrets Supabase', email };
    if (!estOffreApp) return { statut: 'ignore', message: `Autre offre que Booty Flow App (identifiants trouvés : ${offres.join(', ') || 'aucun'})`, email };
    const paiement = lireDatePaiement(corps, maintenant);
    const fin = plusUnMois(paiement);
    const p = await base.trouverProfil(email);

    if (!p) {
      const id = await base.inviter(email, lirePrenom(corps));
      await base.majProfil(id, {
        formule: 'app', statut_abonnement: 'actif', compte_valide: true, origine: 'systemeio',
        dernier_paiement: paiement.toISOString(), fin_acces: fin.toISOString()
      });
      return { statut: 'traite', message: `Compte App créé, accès jusqu'au ${fin.toISOString().slice(0, 10)}, e-mail de bienvenue envoyé`, profil_id: id, email };
    }
    if (p.role === 'coach') return { statut: 'ignore', message: 'Achat avec le compte coach : rien à changer', profil_id: p.id, email };

    // Jamais de rétrogradation : une élève Personnalisé ou Autonomie (validée, non expirée) garde sa formule
    const coaching = (p.formule ?? 'personnalise') !== 'app' && p.compte_valide !== false && p.statut_abonnement !== 'expire';
    if (coaching) {
      await base.majProfil(p.id, { dernier_paiement: plusTard(p.dernier_paiement, paiement).toISOString() });
      return { statut: 'traite', message: `Élève ${p.formule ?? 'personnalise'} : formule de coaching conservée, paiement noté`, profil_id: p.id, email };
    }
    // Abonnée App (active, résiliée ou expirée), compte en attente, ou ancienne élève coaching expirée : accès App ouvert
    const nouvelleFin = plusTard(p.fin_acces, fin);
    await base.majProfil(p.id, {
      formule: 'app', statut_abonnement: 'actif', compte_valide: true,
      dernier_paiement: plusTard(p.dernier_paiement, paiement).toISOString(), fin_acces: nouvelleFin.toISOString()
    });
    const avant = p.formule === 'app' ? (p.statut_abonnement === 'actif' ? 'renouvelé' : 'réactivé') : `ouvert (avant : ${p.formule ?? 'personnalise'}${p.compte_valide === false ? ', en attente' : ', expiré'})`;
    return { statut: 'traite', message: `Abonnement App ${avant}, accès jusqu'au ${nouvelleFin.toISOString().slice(0, 10)}`, profil_id: p.id, email };
  }

  // Annulation : l'accès reste ouvert jusqu'à la fin de la période payée, puis passe en « expire »
  if (offres.length && offresApp.length && !estOffreApp) {
    return { statut: 'ignore', message: `Annulation d'une autre offre (identifiants trouvés : ${offres.join(', ')})`, email };
  }
  const p = await base.trouverProfil(email);
  if (!p) return { statut: 'ignore', message: 'Aucun compte avec cette adresse', email };
  if ((p.formule ?? 'personnalise') !== 'app') return { statut: 'ignore', message: `Élève ${p.formule ?? 'personnalise'} : rien changé`, profil_id: p.id, email };
  if (p.statut_abonnement === 'expire') return { statut: 'ignore', message: 'Abonnement déjà expiré', profil_id: p.id, email };
  const finie = !p.fin_acces || new Date(p.fin_acces).getTime() <= maintenant.getTime();
  const statut: Statut = finie ? 'expire' : 'resilie';
  if (p.statut_abonnement !== statut) await base.majProfil(p.id, { statut_abonnement: statut });
  return {
    statut: 'traite',
    message: finie ? 'Abonnement résilié, période payée terminée : accès fermé' : `Abonnement résilié, accès ouvert jusqu'au ${String(p.fin_acces).slice(0, 10)}`,
    profil_id: p.id, email
  };
}
