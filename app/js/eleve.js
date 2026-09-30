// ESPACE ÉLÈVE — les 5 onglets de la maquette + le formulaire de bilan.
import { api, MODE } from './data.js';
import { NOM_COACH } from './config.js';
import {
  esc, icone, dateCourte, dateAvecJour, joursAvant, nombre, ecart, badge,
  toast, fenetre, fermerFenetre, pendant, courbe
} from './ui.js';

const VERT = '#7FE0B8';
const ORANGE = '#FFB86B';

const ONGLETS = [
  { route: 'accueil', libelle: 'Accueil', icone: 'accueil' },
  { route: 'nutrition', libelle: 'Nutrition', icone: 'nutrition' },
  { route: 'mouvement', libelle: 'Mouvement', icone: 'video' },
  { route: 'posing', libelle: 'Posing', icone: 'etoile', competitrice: true },
  { route: 'progres', libelle: 'Progrès', icone: 'progres' }
];

function navigation(profil, actif) {
  const liens = ONGLETS
    .filter((o) => !o.competitrice || profil.competitrice)
    .map((o) => {
      const on = o.route === actif;
      return `<a href="#/${o.route}" class="onglet${on ? ' actif' : ''}"${on ? ' aria-current="page"' : ''}>
        ${icone(o.icone)}<span>${o.libelle}</span><i></i></a>`;
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
  const pct = Math.min(100, Math.round((profil.semaine / Math.max(1, profil.semaines_total)) * 100));

  racine.innerHTML = page(profil, 'accueil', `
    <img src="img/logo.jpg" alt="Booty Flow Coaching" class="banniere">
    <div class="ligne-entre">
      <div class="bonjour">Bonjour ${esc(profil.prenom)}</div>
      <button class="bouton-rond" id="cloche" aria-label="Notifications">${icone('cloche', 20)}
        ${recentes.length ? '<span class="pastille"></span>' : ''}</button>
    </div>
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
    </section>
    <a href="#/bilan" class="bouton-principal">${icone('check', 18, 'currentColor')}FAIRE MON BILAN</a>
    <div class="pied-accueil">
      <button class="lien" id="installer" hidden>Installer l'app sur mon téléphone</button>
      <button class="lien" id="deconnexion">Se déconnecter</button>
    </div>
  `);

  racine.querySelector('#cloche').addEventListener('click', () => {
    fenetre('Notifications', recentes.length
      ? recentes.map((v) => `<a class="notif" href="#/mouvement" data-fermer><strong>${esc(v.exercice)}</strong>
          <span class="petit">Correction reçue le ${dateCourte(v.corrige_le || v.created_at)}</span></a>`).join('')
      : '<p class="vide">Aucune nouvelle notification.</p>');
  });
}

// ───────────── Nutrition ─────────────
async function nutrition(racine, profil) {
  const n = await api.getNutrition(profil.id);
  const macro = (val, nom) => `<div class="macro"><div class="macro-val">${nombre(val, 0)}<small>g</small></div><div class="petit">${nom}</div></div>`;
  const repas = (n?.repas || []).map((r) => `
    <div class="repas"><div class="repas-heure">${esc(r.heure)}</div>
      <div><strong>${esc(r.nom)}</strong><div class="petit">${esc(r.details)}</div></div></div>`).join('');

  racine.innerHTML = page(profil, 'nutrition', entete('MON PLAN', 'Nutrition') + (n ? `
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
    ${n.pdf_chemin ? `<button class="bouton-contour" id="pdf">${icone('doc', 18)}Mon plan complet (PDF)</button>` : ''}
  ` : `<section class="carte"><p class="vide">Ta coach prépare ton plan nutrition. Il apparaîtra ici dès qu'il sera prêt.</p></section>`));

  racine.querySelector('#pdf')?.addEventListener('click', async () => {
    const url = await api.mediaUrl(n.pdf_chemin);
    if (url) window.open(url, '_blank', 'noopener');
    else toast("Le PDF n'est pas disponible en mode démo.", true);
  });
}

// ───────────── Vidéos (partagé Mouvement / Posing) ─────────────
function carteVideo(v) {
  const corrige = v.statut === 'corrige';
  return `<article class="carte-video">
    <button class="vignette" data-video="${esc(v.id)}" aria-label="Voir la vidéo ${esc(v.exercice)}">${icone('lecture', 20, '#E3C8FF', true)}</button>
    <div class="carte-video-texte">
      <div class="ligne-entre"><strong>${esc(v.exercice)}</strong>${corrige ? badge('Corrigé', VERT) : badge('À corriger', ORANGE)}</div>
      <div class="petit">Envoyée le ${dateCourte(v.created_at)}</div>
      <p class="texte-video">${corrige ? `« ${esc(v.retour)} »` : 'En attente du retour de ta coach.'}</p>
    </div></article>`;
}

function brancherLecture(racine, videos) {
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

  racine.innerHTML = page(profil, 'mouvement', entete('CORRECTIONS', 'Mouvement') + `
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
    <section class="carte">
      <div class="ligne-entre"><div class="surtitre-carte">AVANT / APRÈS</div><span class="petit">Face</span></div>
      <div class="grille-2" id="photos">
        <figure class="photo"><div class="photo-cadre" data-chemin="${esc(premier.photo_face || '')}">Photo</div><figcaption>${dateCourte(premier.date)}</figcaption></figure>
        <figure class="photo"><div class="photo-cadre" data-chemin="${esc(dernier.photo_face || '')}">Photo</div><figcaption>${dateCourte(dernier.date)}</figcaption></figure>
      </div>
    </section>
  ` : `<section class="carte"><p class="vide">Fais ton premier bilan pour voir ta progression ici.</p></section>`) + `
    <a href="#/bilan" class="bouton-principal">${icone('plus', 18)}NOUVEAU BILAN DE LA SEMAINE</a>
  `);
  afficherPhotos(racine);
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

export const ecransEleve = { accueil, nutrition, mouvement, posing, progres, bilan };
