// ESPACE « BOOTY FLOW APP » (formule autonome) + écrans de compte communs à toutes les formules :
// Mon compte, page « Passer au coaching », compte en attente de validation, accès terminé.
import { api } from './data.js';
import { NOM_COACH, NOM_VIDEOTHEQUE, CALENDLY_URL, SYSTEMEIO_ESPACE_CLIENT_URL, PAGE_VENTE_APP_URL } from './config.js';
import { esc, icone, VERSION_APP, dateCourte, badge } from './ui.js';
import { page, entete, blocCharges } from './eleve.js';
import { FORMULES, STATUTS, formuleDe, statutDe, estApp, aAcces, encartCoaching } from './formules.js';
import { carteRappels } from './rappels.js';
import { nouveautes, vignette, chargerMiniatures } from './videotheque.js';
import { programme, questionnaire, etatProgramme } from './programme-app.js';
import { nutritionAbonnee, profilCalcul } from './nutrition-app.js';
import { besoins } from './nutrition-calcul.js';

const lienExterne = (url, texte, classe = 'bouton-principal') => url
  ? `<a href="${esc(url)}" class="${classe}" target="_blank" rel="noopener">${texte}</a>`
  : `<span class="${classe}" aria-disabled="true" title="Lien à régler dans app/js/config.js">${texte}</span>`;

function piedDePage() {
  return `<div class="pied-accueil">
    <a href="#/compte" class="lien">Mon compte</a>
    <button class="lien" id="installer" hidden>Installer l'app sur mon téléphone</button>
    <button class="lien" id="deconnexion">Se déconnecter</button>
    <p class="version">Version ${VERSION_APP}</p>
  </div>`;
}

// Bientôt : écrans construits aux étapes suivantes (programmes, nutrition, live)
const bientot = (texte) => `<section class="carte"><div class="surtitre-carte">BIENTÔT DISPONIBLE</div><p class="texte">${texte}</p></section>`;

// ───────────── Accueil ─────────────
async function accueil(racine, profil) {
  const [nouvelles, etat, reglages] = await Promise.all([nouveautes(profil), etatProgramme(profil).catch(() => null), api.getNutritionApp().catch(() => null)]);
  const besoinsJour = reglages ? besoins(profilCalcul(profil.app), reglages.coefficients) : null;
  const duJour = etat?.seanceDuJour;
  racine.innerHTML = page(profil, 'accueil', `
    <img src="img/banniere.jpg" alt="Booty Flow" class="banniere">
    <div class="ligne-entre"><div class="bonjour">Bonjour ${esc(profil.prenom)}</div>${badge('BOOTY FLOW APP')}</div>
    <a href="#/programme" class="carte carte-training">
      <span class="icone-training">${icone('haltere', 24, 'var(--accent)')}</span>
      <span class="carte-nouveaute-texte"><span class="surtitre-carte">${etat?.termine ? `CYCLE ${etat.pa.cycle_numero} TERMINÉ` : 'LA SÉANCE DU JOUR'}</span>
        <strong>${esc(duJour?.nom || (etat?.termine ? 'Débloque ton cycle suivant' : 'Mon programme'))}</strong>
        <span class="petit">${etat && !etat.termine ? `Cycle ${etat.pa.cycle_numero} · semaine ${etat.semaine} sur 12 · ${etat.faites}/${etat.total} séances` : 'Voir mon programme'}</span></span>
      ${icone('chevron', 18, 'var(--doux)')}</a>
    ${nouvelles.length ? `<a href="#/videotheque" class="carte carte-nouveaute">
      ${vignette(nouvelles[0])}
      <span class="carte-nouveaute-texte"><span class="surtitre-carte">NOUVEAU · ${esc(NOM_VIDEOTHEQUE.toUpperCase())}</span>
        <strong>${esc(nouvelles[0].titre)}</strong></span>
      ${icone('chevron', 18, 'var(--doux)')}</a>` : ''}
    <div class="grille-2">
      <a href="#/nutrition" class="carte carte-mini">${icone('nutrition', 22, 'var(--accent)')}
        <div><div class="petit">Nutrition</div><strong>${besoinsJour ? `${besoinsJour.training.kcal.toLocaleString('fr-FR')} kcal jour training` : 'Mes journées types'}</strong></div></a>
      <a href="#/live" class="carte carte-mini">${icone('video', 22, 'var(--accent)')}
        <div><div class="petit">Live du mois</div><strong>Avec ${esc(NOM_COACH)}</strong></div></a>
    </div>
    <div id="zone-rappels"></div>
    ${encartCoaching('messagerie')}
    ${piedDePage()}
  `);
  chargerMiniatures(racine);
  carteRappels(racine.querySelector('#zone-rappels'), profil);
}

const nutrition = nutritionAbonnee;

async function progres(racine, profil) {
  racine.innerHTML = page(profil, 'progres', entete('MES RÉSULTATS', 'Progression') + `
    <div id="charges"></div>
    ${bientot('Tes mensurations, ton poids et tes photos avec leurs courbes d\'évolution arrivent ici très bientôt.')}
    ${encartCoaching('bilans')}`);
  await blocCharges(racine.querySelector('#charges'), profil.id, true);
}

async function live(racine, profil) {
  racine.innerHTML = page(profil, 'accueil', `
    <header class="entete"><a href="#/accueil" class="bouton-rond" aria-label="Retour">${icone('retour', 20)}</a>
      <div><div class="surtitre">AVEC ${esc(NOM_COACH.toUpperCase())}</div><h1>Live du mois</h1></div></header>`
    + bientot('La date du prochain live, le lien pour le rejoindre et le dépôt de ta vidéo technique du mois arrivent ici très bientôt.'));
}

// Sections de coaching ouvertes par une abonnée App (lien direct, ancien favori…) : encart à la place
function sectionCoaching(section, onglet, surtitre, titre) {
  return async (racine, profil) => {
    racine.innerHTML = page(profil, onglet, entete(surtitre, titre) + encartCoaching(section));
  };
}
function segmentsVideos(actif) {
  const lien = (route, texte) => `<a href="#/${route}" class="segment${route === actif ? ' actif' : ''}"${route === actif ? ' aria-current="page"' : ''}>${texte}</a>`;
  return `<nav class="segments" aria-label="Vidéos">${lien('videotheque', esc(NOM_VIDEOTHEQUE))}${lien('mouvement', 'Corrections vidéo')}</nav>`;
}
async function corrections(racine, profil) {
  racine.innerHTML = page(profil, 'mouvement', entete('VIDÉOS', 'Corrections vidéo') + segmentsVideos('mouvement') + encartCoaching('corrections'));
}

export const ecransApp = {
  accueil, programme, nutrition, progres, live, mouvement: corrections,
  questionnaire: (racine, profil) => questionnaire(racine, profil, { modification: true }),
  training: sectionCoaching('plan_perso', 'programme', 'MON PROGRAMME', 'Programme personnalisé'),
  bilan: sectionCoaching('bilans', 'progres', 'MON SUIVI', 'Bilans'),
  chat: sectionCoaching('messagerie', 'accueil', 'MA COACH', 'Messagerie')
};
export { segmentsVideos };

// ───────────── Mon compte (toutes les formules) ─────────────
export async function compte(racine, profil) {
  const app = estApp(profil);
  const statut = statutDe(profil);
  const couleur = { actif: 'var(--vert)', resilie: 'var(--orange)', expire: 'var(--orange)' }[statut];
  const ligne = (libelle, valeur) => `<div class="ligne-entre ligne-compte"><span class="petit">${libelle}</span><strong>${valeur}</strong></div>`;
  racine.innerHTML = page(profil, app ? 'compte' : 'accueil', `
    <header class="entete">${app ? '' : `<a href="#/accueil" class="bouton-rond" aria-label="Retour">${icone('retour', 20)}</a>`}
      <div><div class="surtitre">${esc(profil.email || '')}</div><h1>Mon compte</h1></div></header>
    <section class="carte">
      ${ligne('Formule', `Booty Flow ${esc(FORMULES[formuleDe(profil)])}`)}
      ${ligne('Statut', `<span style="color:${couleur}">${esc(STATUTS[statut])}</span>`)}
      ${app ? ligne(statut === 'resilie' ? 'Accès ouvert jusqu\'au' : statut === 'expire' ? 'Accès terminé le' : 'Prochain renouvellement', profil.fin_acces ? dateCourte(profil.fin_acces) : '—') : ''}
      ${app && profil.dernier_paiement ? ligne('Dernier paiement', dateCourte(profil.dernier_paiement)) : ''}
    </section>
    ${app && statut === 'resilie' ? `<p class="petit centre">Ton abonnement est résilié : tu gardes tout ton accès jusqu'à la fin de la période payée.</p>` : ''}
    ${app ? `<a href="#/questionnaire" class="bouton-contour">${icone('compte', 18)}Mes informations (âge, poids, niveau…)</a>` : ''}
    ${app ? lienExterne(SYSTEMEIO_ESPACE_CLIENT_URL, 'Gérer mon abonnement', 'bouton-contour') : ''}
    ${aAcces(profil, 'offres') ? `<a href="#/offres" class="bouton-contour">${icone('etoile', 18)}Passer au coaching</a>` : ''}
    ${piedDePage().replace('<a href="#/compte" class="lien">Mon compte</a>', '')}
  `);
}

// ───────────── Passer au coaching (abonnées App UNIQUEMENT) ─────────────
// La base ne renvoie le contenu qu'aux abonnées App : une élève coaching qui tape l'adresse ne reçoit rien.
export async function offres(racine, profil) {
  const liste = aAcces(profil, 'offres') ? await api.listOffres() : [];
  if (!liste.length) { location.replace('#/accueil'); return; }
  const carte = (o) => `<section class="carte offre${o.mise_en_avant ? ' mise-en-avant' : ''}${o.id === 'app' ? ' offre-actuelle' : ''}">
    <div class="ligne-entre"><div class="surtitre-carte">${o.id === 'app' ? 'TA FORMULE ACTUELLE' : 'COACHING'}</div>
      ${o.mise_en_avant ? badge('LE PLUS COMPLET') : ''}</div>
    <h2 class="titre-carte">${esc(o.nom)}</h2>
    ${o.accroche ? `<p class="petit">${esc(o.accroche)}</p>` : ''}
    <ul class="liste-offre">
      ${(o.inclus || []).map((t) => `<li class="inclus">${icone('check', 16, 'var(--vert)')}<span>${esc(t)}</span></li>`).join('')}
      ${(o.non_inclus || []).map((t) => `<li class="non-inclus">${icone('croix', 16, 'var(--doux)')}<span>${esc(t)}</span></li>`).join('')}
    </ul>
    ${o.prix ? `<p class="prix-offre">${esc(o.prix)}</p>` : ''}
    ${o.bouton ? lienExterne(CALENDLY_URL, esc(o.bouton)) : ''}
  </section>`;
  racine.innerHTML = page(profil, 'compte', `
    <header class="entete"><a href="#/compte" class="bouton-rond" aria-label="Retour">${icone('retour', 20)}</a>
      <div><div class="surtitre">BOOTY FLOW</div><h1>Passer au coaching</h1></div></header>
    <p class="texte">Envie d'aller plus loin avec un suivi sur mesure ? Compare les formules, puis réserve ton Audit :
      on fait le point ensemble et je te dis laquelle te correspond.</p>
    <div class="pile">${liste.map(carte).join('')}</div>
    <p class="petit centre">Si tu passes au coaching, tu gardes tout ton historique (charges, mensurations, photos).</p>
  `);
}

// ───────────── Compte en attente de validation ─────────────
export function ecranAttente(racine, profil) {
  racine.innerHTML = `<div class="connexion">
    <img src="img/banniere.jpg" alt="Booty Flow" class="banniere">
    <section class="carte">
      <div class="surtitre-carte">COMPTE EN ATTENTE</div>
      <div class="titre-carte">Bienvenue ${esc(profil.prenom || '')} !</div>
      <p class="texte">Ton compte est bien créé. ${esc(NOM_COACH)} doit maintenant le valider : tu auras accès à ton espace dès que c'est fait.</p>
      <p class="petit">Tu viens de t'abonner à Booty Flow App ? Ouvre plutôt le lien reçu par e-mail pour créer ton mot de passe.</p>
    </section>
    <button class="bouton-contour" onclick="location.reload()">J'ai été validée : actualiser</button>
    <button class="lien" id="deconnexion">Se déconnecter</button>
    <p class="version">Version ${VERSION_APP}</p>
  </div>`;
}

// ───────────── Accès terminé (abonnement expiré) ─────────────
export function ecranFerme(racine, profil) {
  const app = estApp(profil);
  racine.innerHTML = `<div class="connexion">
    <img src="img/banniere.jpg" alt="Booty Flow" class="banniere">
    <section class="carte">
      <div class="surtitre-carte">ACCÈS TERMINÉ</div>
      <div class="titre-carte">${app ? 'Ton abonnement Booty Flow App est terminé' : 'Ton accès est en pause'}</div>
      <p class="texte">${app
        ? `${profil.fin_acces ? `Fin de ton accès : ${dateCourte(profil.fin_acces)}<br>` : ''}Toutes tes données sont gardées : réabonne-toi pour tout retrouver.`
        : `Contacte ${esc(NOM_COACH)} pour réactiver ton espace. Toutes tes données sont gardées.`}</p>
    </section>
    ${app ? lienExterne(PAGE_VENTE_APP_URL, 'ME RÉABONNER') : ''}
    ${app ? lienExterne(SYSTEMEIO_ESPACE_CLIENT_URL, 'Gérer mon abonnement', 'bouton-contour') : ''}
    <button class="lien" id="deconnexion">Se déconnecter</button>
    <p class="version">Version ${VERSION_APP}</p>
  </div>`;
}
