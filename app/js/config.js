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

// Clé publique des notifications (rappels de bilan). Elle peut être visible ;
// la clé privée qui va avec est rangée dans les secrets Supabase (VAPID_PRIVATE_KEY).
export const VAPID_PUBLIC_KEY = 'BMvwomyF4FBLG7_SGkdeO7VcppuBAVG7G5c_yGLBQaVvPGdVNhXa2hVNsUWUKgAU7eqgipsM22EmfdfjA80GX1s';

// ───────────── Booty Flow App (abonnement Systeme.io) ─────────────
// Ton lien Calendly pour réserver un Audit (boutons « Réserver mon Audit » et message de plateau)
export const CALENDLY_URL = 'https://calendly.com/bootyflow/nouvelle-reunion';
// Ton espace client Systeme.io, où l'abonnée gère ou résilie son abonnement (« Gérer mon abonnement »)
export const SYSTEMEIO_ESPACE_CLIENT_URL = '';
// La page de vente Systeme.io de Booty Flow App (bouton « Me réabonner » quand l'accès est terminé)
export const PAGE_VENTE_APP_URL = 'https://www.bootyflow.com/app';
