// ESPACE ÉLÈVE — les 5 onglets de la maquette + le formulaire de bilan.
import { api, MODE } from './data.js';
import { NOM_COACH, NOM_VIDEOTHEQUE } from './config.js';
import {
  esc, icone, VERSION_APP, dateCourte, dateAvecJour, joursAvant, nombre, ecart, badge,
  toast, fenetre, fermerFenetre, pendant, courbe
} from './ui.js';
import { conversation } from './chat.js';
import { carteProgramme, brancherFichiers, estNouveau, nouveauxProgrammes, marquerTrainingVu } from './programmes.js';
import { CATEGORIES, nouveautes, estNouvelle, vignette, chargerMiniatures, ouvrirVideo } from './videotheque.js';

const VERT = '#7FE0B8';
const ORANGE = '#FFB86B';

const ONGLETS = [
  { route: 'accueil', libelle: 'Accueil', icone: 'accueil' },
  { route: 'plan', lien: 'training', libelle: 'Plan personnalisé', icone: 'doc', deuxLignes: true },
  { route: 'mouvement', lien: 'videotheque', libelle: 'Mouvement', icone: 'video' },
  { route: 'posing', libelle: 'Posing', icone: 'etoile', competitrice: true },
  { route: 'progres', libelle: 'Progrès', icone: 'progres' },
  { route: 'chat', libelle: 'Chat', icone: 'chat' }
];

function navigation(profil, actif) {
  const liens = ONGLETS
    .filter((o) => !o.competitrice || profil.competitrice)
    .map((o) => {
      const on = o.route === actif;
      return `<a href="#/${o.lien || o.route}" data-onglet="${o.route}" class="onglet${on ? ' actif' : ''}"${on ? ' aria-current="page"' : ''}>
        ${icone(o.icone)}<span${o.deuxLignes ? ' class="deux-lignes"' : ''}>${o.libelle}</span><i></i></a>`;
    }).join('');
  return `<nav class="barre-onglets" aria-label="Navigation principale">${liens}</nav>`;
}

function entete(surtitre, titre) {
  return `<header class="entete">
    <div><div class="surtitre">${esc(surtitre)}</div><h1>${esc(titre)}</h1></div>
    <img src="img/coach.jpg" alt="Coach ${esc(NOM_COACH)}" class="avatar-coach">
  </header>`;
}

function page(profil, actif, contenu) {
  return `<div class="mobile">
    <main class="mobile-contenu">${contenu}</main>
    ${navigation(profil, actif)}
  </div>`;
}

// ───────────── Accueil ─────────────
async function accueil(racine, profil) {
  const videos = await api.listVideos({ eleveId: profil.id });
  const recentes = videos.filter((v) => v.statut === 'corrige' && joursAvant(v.corrige_le || v.created_at) >= -7);
  const nouvelles = await nouveautes(profil);
  const programmes = await api.listProgrammes(profil.id);
  const programme = programmes[0];
  const programmesNouveaux = programmes.filter((p) => estNouveau(p, profil.id));
  const pct = Math.min(100, Math.round((profil.semaine / Math.max(1, profil.semaines_total)) * 100));

  racine.innerHTML = page(profil, 'accueil', `
    <img src="img/banniere.jpg" alt="Booty Flow Coaching" class="banniere">
    <div class="ligne-entre">
      <div class="bonjour">Bonjour ${esc(profil.prenom)}</div>
      <button class="bouton-rond" id="cloche" aria-label="Notifications">${icone('cloche', 20)}
        ${recentes.length || nouvelles.length || programmesNouveaux.length ? '<span class="pastille"></span>' : ''}</button>
    </div>
    ${programme ? `<a href="#/training" class="carte carte-training${programmesNouveaux.length ? ' nouveau' : ''}">
      <span class="icone-training">${icone('doc', 24, 'var(--accent)')}</span>
      <span class="carte-nouveaute-texte"><span class="surtitre-carte">${programmesNouveaux.length ? 'NOUVEAU · ' : ''}MON TRAINING</span>
        <strong>${esc(programme.titre)}</strong>
        <span class="petit">Voir mon programme</span></span>
      ${icone('chevron', 18, 'var(--doux)')}</a>` : ''}
    ${nouvelles.length ? `<a href="#/videotheque" class="carte carte-nouveaute">
      ${vignette(nouvelles[0])}
      <span class="carte-nouveaute-texte"><span class="surtitre-carte">NOUVEAU · ${esc(NOM_VIDEOTHEQUE.toUpperCase())}</span>
        <strong>${esc(nouvelles[0].titre)}</strong>
        <span class="petit">${nouvelles.length > 1 ? `+ ${nouvelles.length - 1} autre${nouvelles.length > 2 ? 's' : ''} vidéo${nouvelles.length > 2 ? 's' : ''}` : 'Ta coach a ajouté une vidéo'}</span></span>
      ${icone('chevron', 18, 'var(--doux)')}</a>` : ''}
    <section class="carte">
      <div class="surtitre-carte">TON OBJECTIF</div>
      <div class="titre-carte">${esc(profil.objectif || 'Ta coach définit ton objectif')}</div>
      <div class="ligne-entre petit"><span>Semaine ${profil.semaine} sur ${profil.semaines_total}</span><strong class="lilas">${pct} %</strong></div>
      <div class="jauge"><div style="width:${pct}%"></div></div>
    </section>
    <div class="grille-2">
      <a href="#/bilan" class="carte carte-mini">${icone('horloge', 22, 'var(--accent)')}
        <div><div class="petit">Prochain bilan</div><strong>${profil.prochain_bilan ? dateAvecJour(profil.prochain_bilan) : 'À définir'}</strong></div></a>
      <a href="#/mouvement" class="carte carte-mini">${icone('video', 22, 'var(--accent)')}
        <div><div class="petit">Vidéos corrigées</div><strong>${recentes.length ? `${recentes.length} nouvelle${recentes.length > 1 ? 's' : ''}` : 'À jour'}</strong></div></a>
    </div>
    <section class="carte">
      <div class="ligne-auteur"><img src="img/coach.jpg" alt="" class="avatar-petit">
        <div><strong>Coach ${esc(NOM_COACH)}</strong><div class="petit">Message du jour</div></div></div>
      <p class="texte">${profil.message_coach ? esc(profil.message_coach) : 'Pas de nouveau message pour le moment.'}</p>
      <a href="#/chat" class="lien-chat">${icone('chat', 16)}Écrire à ma coach</a>
    </section>
    <a href="#/bilan" class="bouton-principal">${icone('check', 18, 'currentColor')}FAIRE MON BILAN</a>
    <div class="pied-accueil">
      <button class="lien" id="installer" hidden>Installer l'app sur mon téléphone</button>
      <button class="lien" id="deconnexion">Se déconnecter</button>
      <p class="version">Version ${VERSION_APP}</p>
    </div>
  `);

  chargerMiniatures(racine);
  racine.querySelector('#cloche').addEventListener('click', () => {
    const notifs = [
      ...programmesNouveaux.map((p) => ({ date: p.created_at, html: `<a class="notif" href="#/training" data-fermer><strong>Nouveau programme : ${esc(p.titre)}</strong>
          <span class="petit">Training · ajouté le ${dateCourte(p.created_at)}</span></a>` })),
      ...nouvelles.map((v) => ({ date: v.created_at, html: `<a class="notif" href="#/videotheque" data-fermer><strong>Nouvelle vidéo : ${esc(v.titre)}</strong>
          <span class="petit">${esc(NOM_VIDEOTHEQUE)} · ajoutée le ${dateCourte(v.created_at)}</span></a>` })),
      ...recentes.map((v) => ({ date: v.corrige_le || v.created_at, html: `<a class="notif" href="#/mouvement" data-fermer><strong>${esc(v.exercice)}</strong>
          <span class="petit">Correction reçue le ${dateCourte(v.corrige_le || v.created_at)}</span></a>` }))
    ].sort((a, b) => b.date.localeCompare(a.date));
    fenetre('Notifications', notifs.map((n) => n.html).join('') || '<p class="vide">Aucune nouvelle notification.</p>');
  });
}

// ───────────── Nutrition ─────────────
async function nutrition(racine, profil) {
  const n = await api.getNutrition(profil.id);
  const macro = (val, nom) => `<div class="macro"><div class="macro-val">${nombre(val, 0)}<small>g</small></div><div class="petit">${nom}</div></div>`;
  const repas = (n?.repas || []).map((r) => `
    <div class="repas"><div class="repas-heure">${esc(r.heure)}</div>
      <div><strong>${esc(r.nom)}</strong><div class="petit">${esc(r.details)}</div></div></div>`).join('');

  racine.innerHTML = page(profil, 'plan', entete('MON PLAN PERSONNALISÉ', 'Nutrition') + segmentsPlan('nutrition') + (n ? `
    <section class="carte">
      <div class="ligne-entre"><div class="surtitre-carte">OBJECTIF DU JOUR</div>${n.type_jour ? badge(n.type_jour.toUpperCase()) : ''}</div>
      <div class="gros-chiffre">${nombre(n.kcal, 0)} <small>kcal</small></div>
      <div class="grille-3">${macro(n.proteines, 'Protéines')}${macro(n.glucides, 'Glucides')}${macro(n.lipides, 'Lipides')}</div>
    </section>
    <section class="carte">
      <div class="surtitre-carte">MES REPAS</div>
      <div class="liste-repas">${repas || '<p class="vide">Ta coach n\'a pas encore détaillé tes repas.</p>'}</div>
    </section>
    ${n.ajustement ? `<section class="carte carte-ligne">${icone('doc', 22, 'var(--accent)')}
      <div><strong>Dernier ajustement · ${dateCourte(n.ajustement_date)}</strong><div class="petit">${esc(n.ajustement)}</div></div></section>` : ''}
    ${n.pdf_chemin ? `<a class="bouton-contour" data-ouvrir="${esc(n.pdf_chemin)}" target="_blank" rel="noopener" aria-disabled="true">${icone('doc', 18)}Mon plan complet (PDF)</a>` : ''}
  ` : `<section class="carte"><p class="vide">Ta coach prépare ton plan nutrition. Il apparaîtra ici dès qu'il sera prêt.</p></section>`));

  brancherFichiers(racine);
}

// ───────────── Training (programme d'entraînement) ─────────────
function segmentsPlan(actif) {
  const lien = (route, texte) => `<a href="#/${route}" class="segment${route === actif ? ' actif' : ''}"${route === actif ? ' aria-current="page"' : ''}>${texte}</a>`;
  return `<nav class="segments" aria-label="Mon plan personnalisé">${lien('training', 'Training')}${lien('nutrition', 'Nutrition')}</nav>`;
}

async function training(racine, profil) {
  const programmes = await api.listProgrammes(profil.id);
  const [enCours, ...anciens] = programmes;
  racine.innerHTML = page(profil, 'plan', entete('MON PLAN PERSONNALISÉ', 'Training') + segmentsPlan('training') + (enCours ? `
    ${carteProgramme(enCours, { enCours: true, nouveau: estNouveau(enCours, profil.id) })}
    ${anciens.length ? `<details class="anciens-programmes">
      <summary>Programmes précédents (${anciens.length})</summary>
      <div class="pile">${anciens.map((p) => carteProgramme(p, { nouveau: estNouveau(p, profil.id) })).join('')}</div>
    </details>` : ''}
  ` : `<section class="carte"><p class="vide">Ta coach prépare ton programme d'entraînement. Il apparaîtra ici dès qu'il sera prêt.</p></section>`));
  brancherFichiers(racine);
  if (programmes.some((p) => estNouveau(p, profil.id))) {
    marquerTrainingVu(profil.id);
    document.dispatchEvent(new CustomEvent('messages-lus'));
  }
}

// ───────────── Vidéos (partagé Mouvement / Posing) ─────────────
function carteVideo(v) {
  const corrige = v.statut === 'corrige';
  return `<article class="carte-video">
    <button class="vignette" data-video="${esc(v.id)}" aria-label="Voir la vidéo ${esc(v.exercice)}">${icone('lecture', 20, '#E3C8FF', true)}</button>
    <div class="carte-video-texte">
      <div class="ligne-entre"><strong>${esc(v.exercice)}</strong>${corrige ? badge('Corrigé', VERT) : badge('À corriger', ORANGE)}</div>
      <div class="petit">Envoyée le ${dateCourte(v.created_at)}</div>
      ${corrige && v.retour ? `<p class="texte-video">« ${esc(v.retour)} »</p>` : ''}
      ${!corrige ? '<p class="texte-video">En attente du retour de ta coach.</p>' : ''}
      ${v.retour_chemin ? `<button class="bouton-contour compact" data-correction="${esc(v.id)}">${icone('lecture', 16)}Voir la correction vidéo</button>` : ''}
    </div></article>`;
}

function brancherLecture(racine, videos) {
  racine.querySelectorAll('[data-correction]').forEach((b) => b.addEventListener('click', async () => {
    const v = videos.find((x) => x.id === b.dataset.correction);
    const url = await api.mediaUrl(v.retour_chemin);
    fenetre(`Correction · ${v.exercice}`, url
      ? `<video src="${esc(url)}" controls playsinline class="lecteur"></video>`
      : '<p class="vide">Vidéo indisponible.</p>');
  }));
  racine.querySelectorAll('[data-video]').forEach((b) => b.addEventListener('click', async () => {
    const v = videos.find((x) => x.id === b.dataset.video);
    const url = await api.mediaUrl(v.chemin);
    fenetre(v.exercice, url
      ? `<video src="${esc(url)}" controls playsinline class="lecteur"></video>`
      : `<p class="vide">${MODE === 'demo' ? 'Les vidéos d\'exemple de la démo n\'ont pas de fichier.' : 'Vidéo indisponible.'}</p>`);
  }));
}

function formulaireVideo(profil, type, titre, apres) {
  const f = fenetre(titre, `<form class="formulaire" id="form-video">
      <label>Exercice ou pose<input name="exercice" required placeholder="${type === 'posing' ? 'Ex. : Pose 3 · Dos' : 'Ex. : Hip thrust'}"></label>
      <label>Ta vidéo<input name="fichier" type="file" accept="video/*" required></label>
      <p class="petit">Astuce : filme-toi de profil, en entier, avec une bonne lumière.</p>
      <button class="bouton-principal" type="submit">${icone('envoi', 18)}ENVOYER</button>
    </form>`);
  f.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const donnees = new FormData(e.target);
    const fichier = donnees.get('fichier');
    if (fichier.size > 50 * 1024 * 1024) {
      toast('Vidéo trop lourde (50 Mo max). Coupe-la ou réduis la qualité.', true);
      return;
    }
    await pendant(e.submitter, 'Envoi en cours…', () =>
      api.addVideo({ eleveId: profil.id, type, exercice: donnees.get('exercice').trim(), file: fichier }));
    fermerFenetre();
    toast('Vidéo envoyée à ta coach !');
    apres();
  });
}

let filtreVideos = 'toutes';
async function mouvement(racine, profil) {
  const videos = await api.listVideos({ eleveId: profil.id, type: 'mouvement' });
  const aCorriger = videos.filter((v) => v.statut === 'a_corriger').length;
  const visibles = videos.filter((v) => filtreVideos === 'toutes' || v.statut === filtreVideos);
  const filtre = (cle, texte) => `<button class="filtre${filtreVideos === cle ? ' actif' : ''}" data-filtre="${cle}">${texte}</button>`;

  racine.innerHTML = page(profil, 'mouvement', entete('MOUVEMENT', 'Mes corrections') + segments('mouvement') + `
    <button class="zone-envoi" id="envoyer">${icone('envoi', 26, 'var(--accent)')}Envoyer une vidéo d'exercice</button>
    <div class="filtres">${filtre('toutes', 'Toutes')}${filtre('a_corriger', `À corriger · ${aCorriger}`)}${filtre('corrige', `Corrigées · ${videos.length - aCorriger}`)}</div>
    <div class="pile">${visibles.map(carteVideo).join('') || '<p class="vide">Aucune vidéo pour le moment.</p>'}</div>
  `);
  racine.querySelectorAll('[data-filtre]').forEach((b) => b.addEventListener('click', () => {
    filtreVideos = b.dataset.filtre;
    mouvement(racine, profil);
  }));
  racine.querySelector('#envoyer').addEventListener('click', () =>
    formulaireVideo(profil, 'mouvement', 'Envoyer une vidéo', () => mouvement(racine, profil)));
  brancherLecture(racine, videos);
}

// ───────────── Vidéothèque (vidéos d'explication de la coach) ─────────────
function segments(actif) {
  const lien = (route, texte) => `<a href="#/${route}" class="segment${route === actif ? ' actif' : ''}"${route === actif ? ' aria-current="page"' : ''}>${texte}</a>`;
  return `<nav class="segments" aria-label="Mouvement">${lien('videotheque', esc(NOM_VIDEOTHEQUE))}${lien('mouvement', 'Mes corrections')}</nav>`;
}

let categorieBiblio = 'Toutes';
async function videotheque(racine, profil) {
  const liste = await api.listBibliotheque();
  const categories = ['Toutes', ...CATEGORIES.filter((c) => liste.some((v) => v.categorie === c))];
  if (!categories.includes(categorieBiblio)) categorieBiblio = 'Toutes';
  const visibles = liste.filter((v) => categorieBiblio === 'Toutes' || v.categorie === categorieBiblio);

  racine.innerHTML = page(profil, 'mouvement', entete('MOUVEMENT', NOM_VIDEOTHEQUE) + segments('videotheque') + `
    <p class="petit">Les explications de ta coach pour bien exécuter chaque mouvement.</p>
    ${categories.length > 2 ? `<div class="filtres defile-filtres">${categories.map((c) =>
      `<button class="filtre${c === categorieBiblio ? ' actif' : ''}" data-categorie="${esc(c)}">${esc(c)}</button>`).join('')}</div>` : ''}
    <div class="grille-biblio">${visibles.map((v) => `
      <button class="carte-biblio" data-biblio="${esc(v.id)}">
        ${vignette(v)}
        <span class="carte-biblio-texte">
          ${estNouvelle(v, profil) ? '<span class="badge-nouveau">NOUVEAU</span>' : ''}
          <strong>${esc(v.titre)}</strong>
          <span class="petit">${esc(v.categorie)}</span>
        </span>
      </button>`).join('') || `<p class="vide">Ta coach n'a pas encore ajouté de vidéo. Tu seras prévenue dès qu'il y en aura une.</p>`}
    </div>`);

  racine.querySelectorAll('[data-categorie]').forEach((b) => b.addEventListener('click', () => {
    categorieBiblio = b.dataset.categorie;
    videotheque(racine, profil);
  }));
  racine.querySelectorAll('[data-biblio]').forEach((b) => b.addEventListener('click', () =>
    ouvrirVideo(liste.find((v) => v.id === b.dataset.biblio))));
  chargerMiniatures(racine);

  // Ouverture de la vidéothèque : les nouveautés sont vues (le badge « Nouveau » reste affiché jusqu'à la prochaine visite)
  if (liste.some((v) => estNouvelle(v, profil))) {
    try {
      await api.markBibliothequeVue();
      profil.biblio_vue_le = new Date().toISOString();
      document.dispatchEvent(new CustomEvent('messages-lus'));
    } catch (e) { /* on réessaiera à la prochaine visite */ }
  }
}

// ───────────── Posing (compétitrices) ─────────────
async function posing(racine, profil) {
  if (!profil.competitrice) { location.hash = '#/accueil'; return; }
  const [c, videos] = await Promise.all([api.getCompetition(profil.id), api.listVideos({ eleveId: profil.id, type: 'posing' })]);
  const j = c?.date_compet ? joursAvant(c.date_compet) : null;

  racine.innerHTML = page(profil, 'posing', entete('ESPACE COMPÉTITRICE', 'Posing') + `
    <section class="carte carte-compet">
      <div><strong class="titre-carte">${esc(c?.nom || 'Compétition à définir')}</strong>
        <div class="petit">${c?.categorie ? `Catégorie ${esc(c.categorie)}` : ''}</div>
        <div class="petit">${c?.date_compet ? `${dateCourte(c.date_compet)}${c.ville ? ` · ${esc(c.ville)}` : ''}` : ''}</div></div>
      ${j !== null ? `<div class="compte-rebours"><div>${j >= 0 ? `J-${j}` : 'Fait'}</div><small>AVANT LA SCÈNE</small></div>` : ''}
    </section>
    ${c?.poses?.length ? `<div class="surtitre-carte">POSES IMPOSÉES</div>
      <div class="defile">${c.poses.map((p, i) => `<div class="pose">${icone('etoile', 22, 'var(--accent)')}<small>POSE ${i + 1}</small><strong>${esc(p.nom)}</strong></div>`).join('')}</div>` : ''}
    ${c?.checklist?.length ? `<section class="carte"><div class="surtitre-carte">PRÉPA JOUR J</div>
      ${c.checklist.map((t, i) => `<label class="case"><input type="checkbox" data-tache="${i}" ${t.fait ? 'checked' : ''}><span>${esc(t.label)}</span></label>`).join('')}</section>` : ''}
    <button class="bouton-principal" id="envoyer">${icone('video', 18)}ENVOYER MON POSING</button>
    <div class="pile">${videos.map(carteVideo).join('')}</div>
  `);

  racine.querySelectorAll('[data-tache]').forEach((caseACocher) => caseACocher.addEventListener('change', async () => {
    c.checklist[caseACocher.dataset.tache].fait = caseACocher.checked;
    try { await api.saveChecklist(profil.id, c.checklist); } catch (e) { toast(e.message, true); }
  }));
  racine.querySelector('#envoyer').addEventListener('click', () =>
    formulaireVideo(profil, 'posing', 'Envoyer mon posing', () => posing(racine, profil)));
  brancherLecture(racine, videos);
}

// ───────────── Progression ─────────────
async function progres(racine, profil) {
  const bilans = await api.listBilans(profil.id);
  const premier = bilans[0], dernier = bilans[bilans.length - 1];
  const mesure = (cle, nom) => `<div class="carte mesure"><div class="petit">${nom}</div>
    <strong>${nombre(dernier?.[cle])} cm</strong>
    <small class="lilas">${premier && dernier && premier !== dernier ? `${ecart(dernier[cle] - premier[cle])} cm` : ''}</small></div>`;
  const semaines = premier ? Math.max(1, Math.round(-joursAvant(premier.date) / 7)) : 0;

  racine.innerHTML = page(profil, 'progres', entete('MES RÉSULTATS', 'Progression') + (bilans.length ? `
    <section class="carte">
      <div class="ligne-entre"><div class="surtitre-carte">POIDS · ${semaines} SEMAINE${semaines > 1 ? 'S' : ''}</div>
        ${bilans.length > 1 ? badge(`${ecart(dernier.poids - premier.poids)} kg`) : ''}</div>
      ${courbe(bilans.map((b) => ({ valeur: b.poids })))}
    </section>
    <div class="grille-3">${mesure('taille', 'Taille')}${mesure('hanches', 'Hanches')}${mesure('cuisse', 'Cuisse')}</div>
    <div id="charges"></div>
    <section class="carte">
      <div class="ligne-entre"><div class="surtitre-carte">AVANT / APRÈS</div><span class="petit">Face</span></div>
      <div class="grille-2" id="photos">
        <figure class="photo"><div class="photo-cadre" data-chemin="${esc(premier.photo_face || '')}">Photo</div><figcaption>${dateCourte(premier.date)}</figcaption></figure>
        <figure class="photo"><div class="photo-cadre" data-chemin="${esc(dernier.photo_face || '')}">Photo</div><figcaption>${dateCourte(dernier.date)}</figcaption></figure>
      </div>
    </section>
  ` : `<section class="carte"><p class="vide">Fais ton premier bilan pour voir ta progression ici.</p></section>
    <div id="charges"></div>`) + `
    <a href="#/bilan" class="bouton-principal">${icone('plus', 18)}NOUVEAU BILAN DE LA SEMAINE</a>
  `);
  afficherPhotos(racine);
  await blocCharges(racine.querySelector('#charges'), profil.id, true);
}

// ───────────── Suivi des charges (utilisé aussi dans la fiche coach) ─────────────
const EXERCICES_COURANTS = [
  'Hip thrust', 'Squat', 'Squat bulgare', 'Fentes', 'Fentes marchées', 'Soulevé de terre',
  'Soulevé de terre roumain', 'Presse à cuisses', 'Leg curl', 'Leg extension', 'Abduction machine',
  'Kickback poulie', 'Good morning', 'Step-up', 'Glute bridge', 'Hack squat', 'Développé couché',
  'Développé militaire', 'Tirage vertical', 'Rowing', 'Élévations latérales', 'Curl biceps', 'Extension triceps'
];

function detailSerie(c) {
  return c.series && c.reps ? `${c.series} × ${c.reps}` : c.reps ? `${c.reps} reps` : '';
}

// Regroupe les charges par exercice (le plus récemment travaillé en premier)
function parExercice(charges) {
  const groupes = new Map();
  for (const c of charges) {
    if (!groupes.has(c.exercice)) groupes.set(c.exercice, []);
    groupes.get(c.exercice).push(c);
  }
  return [...groupes.entries()]
    .map(([exercice, liste]) => ({ exercice, liste }))
    .sort((a, b) => b.liste[b.liste.length - 1].date.localeCompare(a.liste[a.liste.length - 1].date));
}

export async function blocCharges(zone, eleveId, modifiable) {
  if (!zone) return;
  const charges = await api.listCharges(eleveId);
  const groupes = parExercice(charges);
  const cartes = groupes.map(({ exercice, liste }) => {
    const premier = liste[0], dernier = liste[liste.length - 1];
    const record = Math.max(...liste.map((c) => Number(c.poids)));
    const progression = Number(dernier.poids) - Number(premier.poids);
    return `<button class="ligne-charge" data-exercice="${esc(exercice)}">
      <span class="ligne-charge-texte"><strong>${esc(exercice)}</strong>
        <span class="petit">${dateCourte(dernier.date)}${detailSerie(dernier) ? ` · ${detailSerie(dernier)}` : ''} · record ${nombre(record)} kg</span></span>
      <span class="ligne-charge-valeur"><strong>${nombre(dernier.poids)} kg</strong>
        ${liste.length > 1 ? `<small class="${progression > 0 ? 'vert' : 'gris'}">${ecart(progression)} kg</small>` : ''}</span>
      ${icone('chevron', 18, 'var(--doux)')}
    </button>`;
  }).join('');

  zone.innerHTML = `<section class="carte">
    <div class="ligne-entre"><div class="surtitre-carte">${modifiable ? 'MES CHARGES' : 'CHARGES'}</div>
      ${modifiable ? `<button class="bouton-contour compact" id="noter-charge">${icone('plus', 16)}Noter</button>` : ''}</div>
    <div class="liste-charges">${cartes || `<p class="vide">${modifiable
      ? 'Note tes charges après chaque séance pour suivre ta progression exercice par exercice.'
      : 'Aucune charge notée pour le moment.'}</p>`}</div>
  </section>`;

  const recharger = () => blocCharges(zone, eleveId, modifiable);
  zone.querySelector('#noter-charge')?.addEventListener('click', () =>
    formulaireCharge(eleveId, groupes.map((g) => g.exercice), '', recharger));
  zone.querySelectorAll('[data-exercice]').forEach((b) => b.addEventListener('click', () => {
    const groupe = groupes.find((g) => g.exercice === b.dataset.exercice);
    detailCharge(eleveId, groupe, groupes.map((g) => g.exercice), modifiable, recharger);
  }));
}

function detailCharge(eleveId, { exercice, liste }, exercices, modifiable, recharger) {
  const historique = [...liste].reverse().map((c) => `<div class="historique-ligne">
      <span class="petit">${dateCourte(c.date)}</span>
      <strong>${nombre(c.poids)} kg</strong>
      <span class="petit">${detailSerie(c)}</span>
      ${modifiable ? `<button class="bouton-icone" data-suppr-charge="${esc(c.id)}" aria-label="Supprimer la charge du ${dateCourte(c.date)}">${icone('poubelle', 16)}</button>` : '<span></span>'}
      ${c.note ? `<span class="petit historique-note">« ${esc(c.note)} »</span>` : ''}
    </div>`).join('');
  const f = fenetre(exercice, `
    ${courbe(liste.map((c) => ({ valeur: c.poids })), {
      libelle: `Charges sur ${exercice}`, vide: 'La courbe apparaîtra à partir de deux séances notées.'
    })}
    <div class="historique">${historique}</div>
    ${modifiable ? `<button class="bouton-principal" id="noter-meme">${icone('plus', 18)}NOTER UNE NOUVELLE CHARGE</button>` : ''}`);
  f.querySelector('#noter-meme')?.addEventListener('click', () => formulaireCharge(eleveId, exercices, exercice, recharger));
  f.querySelectorAll('[data-suppr-charge]').forEach((b) => b.addEventListener('click', async () => {
    if (!confirm('Supprimer cette charge ?')) return;
    await pendant(b, '…', () => api.deleteCharge(b.dataset.supprCharge));
    fermerFenetre();
    toast('Charge supprimée.');
    recharger();
  }));
}

function formulaireCharge(eleveId, exercices, exercice, recharger) {
  const suggestions = [...new Set([...exercices, ...EXERCICES_COURANTS])];
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const f = fenetre('Noter une charge', `<form class="formulaire">
    <label>Exercice<input name="exercice" list="liste-exercices" value="${esc(exercice)}" required placeholder="Ex. : Hip thrust" autocomplete="off"></label>
    <datalist id="liste-exercices">${suggestions.map((e) => `<option value="${esc(e)}"></option>`).join('')}</datalist>
    <label>Charge<span class="avec-unite"><input name="poids" type="number" inputmode="decimal" step="0.5" min="0" required><em>kg</em></span></label>
    <div class="grille-3">
      <label>Séries<input name="series" type="number" inputmode="numeric" min="1" step="1" placeholder="4"></label>
      <label>Répétitions<input name="reps" type="number" inputmode="numeric" min="1" step="1" placeholder="10"></label>
      <label>Date<input name="date" type="date" value="${aujourdhui}" max="${aujourdhui}" required></label>
    </div>
    <label>Remarque (facultatif)<input name="note" placeholder="Ex. : dernière série difficile"></label>
    <button class="bouton-principal" type="submit">${icone('check', 18)}ENREGISTRER</button>
  </form>`);
  if (exercice) f.querySelector('[name=poids]').focus();
  f.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = new FormData(e.target);
    const entier = (k) => (d.get(k) === '' ? null : Math.round(Number(d.get(k))));
    const nom = d.get('exercice').trim();
    const poids = Number(d.get('poids'));
    // Même nom qu'un exercice déjà noté, sans tenir compte des majuscules
    const existant = exercices.find((x) => x.toLowerCase() === nom.toLowerCase()) || nom;
    const avant = (await api.listCharges(eleveId)).filter((c) => c.exercice === existant);
    await pendant(e.submitter, 'Enregistrement…', () => api.addCharge(eleveId, {
      exercice: existant, poids, series: entier('series'), reps: entier('reps'),
      date: d.get('date'), note: d.get('note').trim()
    }));
    fermerFenetre();
    const record = avant.length && poids > Math.max(...avant.map((c) => Number(c.poids)));
    toast(record ? `Nouveau record sur ${existant}, bravo !` : 'Charge enregistrée.');
    recharger();
  });
}

export async function afficherPhotos(racine) {
  for (const cadre of racine.querySelectorAll('[data-chemin]')) {
    const url = await api.mediaUrl(cadre.dataset.chemin);
    if (url) cadre.innerHTML = `<img src="${esc(url)}" alt="">`;
  }
}

// ───────────── Formulaire de bilan ─────────────
async function bilan(racine, profil) {
  const champ = (nom, libelle, unite, pas = '0.1') =>
    `<label>${libelle}<span class="avec-unite"><input name="${nom}" type="number" inputmode="decimal" step="${pas}" min="0"><em>${unite}</em></span></label>`;
  const photo = (cote, libelle) =>
    `<label class="choix-photo">${icone('photo', 22, 'var(--accent)')}<span>${libelle}</span><input type="file" name="${cote}" accept="image/*"></label>`;

  racine.innerHTML = page(profil, 'progres', `
    <header class="entete"><a href="#/progres" class="bouton-rond" aria-label="Retour">${icone('retour', 20)}</a>
      <div><div class="surtitre">MON SUIVI</div><h1>Bilan de la semaine</h1></div></header>
    <form class="formulaire" id="form-bilan">
      <section class="carte"><div class="surtitre-carte">MENSURATIONS</div>
        ${champ('poids', 'Poids', 'kg')}
        <div class="grille-3">${champ('taille', 'Taille', 'cm')}${champ('hanches', 'Hanches', 'cm')}${champ('cuisse', 'Cuisse', 'cm')}</div>
      </section>
      <section class="carte"><div class="surtitre-carte">PHOTOS</div>
        <div class="grille-3">${photo('face', 'Face')}${photo('profil', 'Profil')}${photo('dos', 'Dos')}</div>
      </section>
      <section class="carte"><div class="surtitre-carte">MON RESSENTI</div>
        <textarea name="ressenti" rows="4" placeholder="Énergie, faim, sommeil, séances difficiles…"></textarea>
      </section>
      <button class="bouton-principal" type="submit">${icone('check', 18)}ENVOYER MON BILAN</button>
    </form>
  `);

  racine.querySelectorAll('.choix-photo input').forEach((entree) => entree.addEventListener('change', () => {
    entree.parentElement.classList.toggle('choisie', entree.files.length > 0);
  }));

  racine.querySelector('#form-bilan').addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = new FormData(e.target);
    const num = (k) => (d.get(k) === '' ? null : Number(d.get(k)));
    const fichier = (k) => (d.get(k)?.size ? d.get(k) : null);
    await pendant(e.submitter, 'Envoi en cours…', () => api.addBilan(profil.id, {
      poids: num('poids'), taille: num('taille'), hanches: num('hanches'), cuisse: num('cuisse'),
      ressenti: d.get('ressenti').trim()
    }, { face: fichier('face'), profil: fichier('profil'), dos: fichier('dos') }));
    toast('Bilan envoyé à ta coach, bravo !');
    location.hash = '#/progres';
  });
}

// ───────────── Chat avec la coach ─────────────
async function chat(racine, profil) {
  racine.innerHTML = page(profil, 'chat', '<div class="chat-plein" id="chat-zone"></div>');
  await conversation(racine.querySelector('#chat-zone'), {
    eleveId: profil.id, moiCoach: false,
    titre: `Coach ${NOM_COACH}`, sousTitre: 'Réponse en général sous 24 h',
    avatar: '<img src="img/coach.jpg" alt="" class="avatar-coach">'
  });
}

export const ecransEleve = { accueil, training, nutrition, mouvement, videotheque, posing, progres, bilan, chat };
