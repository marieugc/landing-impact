// ─────────────────────────────────────────────────────────────
//  RÉGLAGES DE L'APP — c'est le seul fichier que tu dois modifier
// ─────────────────────────────────────────────────────────────
//
// Tant que ces deux lignes sont vides, l'app tourne en MODE DÉMO :
// les données sont fictives et restent sur ton téléphone/ordinateur.
//
// Pour passer en vrai (comptes élèves, vidéos, bilans enregistrés),
// suis l'étape 3 du fichier GUIDE.md et colle ici tes deux clés Supabase.

export const SUPABASE_URL = 'https://ubenkqedyjrdeyetzzet.supabase.co';
// Clé publique (« publishable » sb_publishable_… ou « anon » eyJ…). Elle peut être visible :
// les données sont protégées par les règles de supabase/schema.sql.
// Ne jamais mettre ici une clé « secret » ou « service_role ».
export const SUPABASE_ANON_KEY = 'sb_publishable_4IdY5QqBjknxKgKMOaAdJw_5J9VGJaR';

// Prénom affiché côté élève pour la coach
export const NOM_COACH = 'Marie';

// Nom de la bibliothèque de vidéos d'explication (tu peux le changer ici)
export const NOM_VIDEOTHEQUE = 'Vidéothèque';
