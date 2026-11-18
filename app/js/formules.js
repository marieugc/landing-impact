// Formules Booty Flow (Personnalisé, Autonomie, App) et droits d'accès.
// Mêmes règles que supabase/formules.sql : l'interface masque, la base de données refuse.
import { esc, icone } from './ui.js';

export const FORMULES = { personnalise: 'Personnalisé', autonomie: 'Autonomie', app: 'App' };
export const STATUTS = { actif: 'Actif', resilie: 'Résilié', expire: 'Expiré' };

// Jours de marge après la date de fin pour un abonnement actif (le temps que le paiement du mois arrive)
export const JOURS_DE_MARGE = 3;

// Les élèves inscrites avant les formules n'ont pas encore ces champs : elles sont « personnalise », validées et actives
export const formuleDe = (p) => p?.formule || 'personnalise';
export const statutDe = (p) => p?.statut_abonnement || 'actif';
export const estApp = (p) => p?.role !== 'coach' && formuleDe(p) === 'app';
export const compteValide = (p) => p?.role === 'coach' || p?.compte_valide !== false;

export function accesOuvert(p) {
  if (!p) return false;
  if (p.role === 'coach') return true;
  if (!compteValide(p) || statutDe(p) === 'expire') return false;
  if (!estApp(p) || !p.fin_acces) return true;
  const marge = statutDe(p) === 'actif' ? JOURS_DE_MARGE * 864e5 : 0;
  return Date.now() < new Date(p.fin_acces).getTime() + marge;
}

// Ce que chaque formule peut ouvrir
const COACHING = ['plan_perso', 'bilans', 'messagerie', 'corrections', 'posing', 'videotheque', 'charges'];
const DROITS = {
  personnalise: COACHING,
  autonomie: COACHING,
  app: ['programmes_app', 'videotheque', 'nutrition_app', 'progression', 'charges', 'live', 'offres']
};
export const aAcces = (p, fonction) => accesOuvert(p) && (DROITS[formuleDe(p)] || []).includes(fonction);

// Bilan : chaque semaine (Personnalisé), toutes les 4 semaines (Autonomie)
export const intervalleBilan = (p) => (formuleDe(p) === 'autonomie' ? 28 : 7);

// Encart affiché aux abonnées App à la place des sections de coaching
export const SECTIONS_COACHING = {
  plan_perso: ['Programme et plan alimentaire personnalisés', 'Un programme et une diète construits pour toi, ajustés au fil de tes bilans.'],
  bilans: ['Bilans avec ta coach', 'Chaque bilan reçoit un retour personnalisé : mensurations, photos, ressenti, ajustements.'],
  messagerie: ['Messagerie et suivi individuel', 'Pose tes questions à ta coach à l\'écrit ou en vocal, et sois suivie de près.'],
  corrections: ['Corrections vidéo individuelles', 'Envoie tes vidéos d\'exercices et reçois une correction détaillée de ta technique.']
};
export function encartCoaching(section) {
  const [titre, texte] = SECTIONS_COACHING[section] || ['Suivi individuel', ''];
  return `<section class="carte encart-coaching">
    <div class="ligne-auteur"><span class="icone-cadenas">${icone('cadenas', 20, 'var(--accent)')}</span>
      <div class="surtitre-carte">DISPONIBLE DANS LE COACHING BOOTY FLOW</div></div>
    <strong>${esc(titre)}</strong>
    <p class="petit">${esc(texte)}</p>
    <a href="#/offres" class="bouton-contour compact">Découvrir le coaching${icone('chevron', 16)}</a>
  </section>`;
}
