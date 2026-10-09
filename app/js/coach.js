// ESPACE COACH — tableau de bord, fiches élèves, corrections vidéo, bilans, compétitrices.
import { api, MODE } from './data.js';
import {
  esc, icone, VERSION_APP, dateCourte, joursAvant, nombre, ecart, badge,
  toast, fenetre, fermerFenetre, pendant, courbe
} from './ui.js';
import { afficherPhotos, blocCharges } from './eleve.js';
import { conversation } from './chat.js';
import { NOM_VIDEOTHEQUE } from './config.js';
import { carteProgramme, brancherFichiers } from './programmes.js';
import { CATEGORIES, vignette, chargerMiniatures, ouvrirVideo, lienValide } from './videotheque.js';

const VERT = '#7FE0B8';
const ORANGE = '#FFB86B';
const GRIS = '#BCA8DE';

const MENU = [
  { route: 'coach', libelle: 'Mes élèves', icone: 'eleves' },
  { route: 'coach/nutrition', libelle: 'Plans nutrition', icone: 'nutrition' },
  { route: 'coach/videos', libelle: 'Vidéos à corriger', icone: 'video' },
  { route: 'coach/competitrices', libelle: 'Compétitrices', icone: 'etoile' },
  { route: 'coach/bilans', libelle: 'Bilans', icone: 'progres' },
  { route: 'coach/charges', libelle: 'Suivi des charges', icone: 'haltere' },
  { route: 'coach/messages', libelle: 'Messages', icone: 'chat' },
  { route: 'coach/videotheque', libelle: NOM_VIDEOTHEQUE, icone: 'lecture' }
];

function page(profil, actif, contenu) {
  const liens = MENU.map((m) => {
    const on = m.route === actif;
    return `<a href="#/${m.route}" class="menu-lien${on ? ' actif' : ''}"${on ? ' aria-current="page"' : ''}>${icone(m.icone, 20)}<span>${m.libelle}</span></a>`;
  }).join('');
  return `<div class="bureau">
    <aside class="barre-laterale">
      <img src="img/banniere.jpg" alt="Booty Flow Coaching" class="logo-lateral">
      <nav aria-label="Menu coach">${liens}</nav>
      <button class="menu-lien deconnexion" id="deconnexion">${icone('sortie', 20)}<span>Se déconnecter</span></button>
    </aside>
    <main class="bureau-contenu">${contenu}<p class="version">Booty Flow · version ${VERSION_APP}</p></main>
  </div>`;
}

function titre(texte, action = '') {
  return `<div class="bureau-tete">
    <div><div class="surtitre">ESPACE COACH</div><h1>${texte}</h1></div>
    <div class="bureau-actions">${action}<img src="img/coach.jpg" alt="" class="avatar-coach"></div>
  </div>`;
}

function statutEleve(e, aCorriger, bilans) {
  if (aCorriger.some((v) => v.eleve_id === e.id)) return ['Vidéo à corriger', ORANGE];
  if (bilans.some((b) => b.eleve_id === e.id && !b.lu)) return ['Bilan reçu', VERT];
  if (e.prochain_bilan && joursAvant(e.prochain_bilan) < 0) return ['Bilan en retard', ORANGE];
  return ['À jour', GRIS];
}

function initiale(prenom) {
  return `<span class="initiale" aria-hidden="true">${esc((prenom || '?').charAt(0).toUpperCase())}</span>`;
}

// ───────────── Tableau de bord : Mes élèves ─────────────
async function tableau(racine, profil) {
  const [eleves, aCorriger, bilans] = await Promise.all([
    api.listEleves(), api.listVideos({ statut: 'a_corriger' }), api.listBilans()
  ]);
  const nonLus = bilans.filter((b) => !b.lu).length;
  const stat = (libelle, valeur, ic, lien) => `<a href="${lien}" class="carte stat">
    <div class="ligne-entre"><span class="petit">${libelle}</span>${icone(ic, 20, 'var(--accent)')}</div>
    <strong>${valeur}</strong></a>`;

  const lignes = eleves.map((e) => {
    const [statut, couleur] = statutEleve(e, aCorriger, bilans);
    return `<a href="#/coach/eleve/${esc(e.id)}" class="tableau-ligne">
      <span class="cellule-nom">${initiale(e.prenom)}<strong>${esc(e.prenom)}</strong>${e.competitrice ? badge('COMPÉTITRICE') : ''}</span>
      <span class="gris">${esc(e.objectif || '—')}</span>
      <span>Sem. ${e.semaine} / ${e.semaines_total}</span>
      <span class="statut" style="color:${couleur}">${statut}</span>
      <span class="gris" aria-hidden="true">${icone('chevron', 20)}</span>
    </a>`;
  }).join('');

  racine.innerHTML = page(profil, 'coach', titre(`Bonjour ${esc(profil.prenom)}`,
    `<button class="bouton-principal compact" id="ajouter">${icone('plus', 18)}AJOUTER UNE ÉLÈVE</button>`) + `
    <div class="grille-stats">
      ${stat('Élèves actives', eleves.length, 'eleves', '#/coach')}
      ${stat('Vidéos à corriger', aCorriger.length, 'video', '#/coach/videos')}
      ${stat('Bilans reçus', nonLus, 'check', '#/coach/bilans')}
      ${stat('Compétitrices', eleves.filter((e) => e.competitrice).length, 'etoile', '#/coach/competitrices')}
    </div>
    <section class="carte tableau">
      <div class="tableau-tete"><span>ÉLÈVE</span><span>OBJECTIF</span><span>SEMAINE</span><span>STATUT</span><span></span></div>
      ${lignes || '<p class="vide">Aucune élève inscrite pour le moment. Clique sur « Ajouter une élève ».</p>'}
    </section>
  `);

  racine.querySelector('#ajouter').addEventListener('click', () => {
    const lien = location.origin + location.pathname;
    const message = `Coucou ! Voici ton espace Booty Flow : ${lien}\nCrée ton compte avec « Créer mon compte », puis ajoute l'app sur ton écran d'accueil.`;
    const f = fenetre('Ajouter une élève', `
      <p>Envoie ce message à ton élève (SMS, WhatsApp, Instagram…). Elle crée son compte et apparaît automatiquement dans ta liste.</p>
      <textarea readonly rows="4" class="message-invitation">${esc(message)}</textarea>
      <button class="bouton-principal" id="copier">COPIER LE MESSAGE</button>
      ${MODE === 'demo' ? '<p class="petit">Mode démo : l\'inscription fonctionne mais reste sur cet appareil.</p>' : ''}`);
    f.querySelector('#copier').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(message); toast('Message copié !'); }
      catch (e) { f.querySelector('textarea').select(); toast('Sélectionne le texte et copie-le.'); }
    });
  });
}

// ───────────── Fiche élève ─────────────
const ONGLETS_FICHE = [['suivi', 'Suivi'], ['training', 'Training'], ['nutrition', 'Nutrition'], ['videos', 'Vidéos'], ['bilans', 'Bilans'], ['charges', 'Charges'], ['competition', 'Compétition']];

async function fiche(racine, profil, [eleveId, onglet = 'suivi']) {
  const e = await api.getProfile(eleveId);
  if (!e) { racine.innerHTML = page(profil, 'coach', titre('Élève introuvable')); return; }
  const onglets = ONGLETS_FICHE
    .filter(([cle]) => cle !== 'competition' || e.competitrice)
    .map(([cle, nom]) => `<a href="#/coach/eleve/${esc(e.id)}/${cle}" class="filtre${cle === onglet ? ' actif' : ''}">${nom}</a>`).join('');

  racine.innerHTML = page(profil, 'coach', `
    <div class="bureau-tete"><div class="ligne-auteur">
      <a href="#/coach" class="bouton-rond" aria-label="Retour à la liste">${icone('retour', 20)}</a>
      ${initiale(e.prenom)}<div><div class="surtitre">FICHE ÉLÈVE</div><h1>${esc(e.prenom)}</h1></div></div>
      <div class="bureau-actions"><span class="petit">${esc(e.email || '')}</span>
        <a href="#/coach/messages/${esc(e.id)}" class="bouton-contour compact">${icone('chat', 16)}Écrire</a></div></div>
    <div class="filtres">${onglets}</div>
    <div id="onglet"></div>
  `);
  const zone = racine.querySelector('#onglet');
  const recharger = () => fiche(racine, profil, [eleveId, onglet]);
  await ({ suivi: ficheSuivi, training: ficheTraining, nutrition: ficheNutrition, videos: ficheVideos, bilans: ficheBilans, charges: ficheCharges, competition: ficheCompetition }[onglet] || ficheSuivi)(zone, e, recharger);
}

async function ficheSuivi(zone, e, recharger) {
  zone.innerHTML = `<form class="formulaire carte large" id="form-suivi">
    <label>Prénom<input name="prenom" value="${esc(e.prenom)}" required></label>
    <label>Objectif<input name="objectif" value="${esc(e.objectif || '')}" placeholder="Ex. : Galber le bas du corps"></label>
    <div class="grille-3">
      <label>Semaine actuelle<input name="semaine" type="number" min="1" value="${e.semaine}"></label>
      <label>Sur (semaines)<input name="semaines_total" type="number" min="1" value="${e.semaines_total}"></label>
      <label>Prochain bilan<input name="prochain_bilan" type="date" value="${esc(e.prochain_bilan || '')}"></label>
    </div>
    <label>Message du jour (affiché sur son accueil)<textarea name="message_coach" rows="4">${esc(e.message_coach || '')}</textarea></label>
    <label class="case"><input type="checkbox" name="competitrice" ${e.competitrice ? 'checked' : ''}><span>Compétitrice (active l'onglet Posing)</span></label>
    <button class="bouton-principal" type="submit">ENREGISTRER</button>
  </form>`;
  zone.querySelector('form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const d = new FormData(ev.target);
    await pendant(ev.submitter, 'Enregistrement…', () => api.updateProfile(e.id, {
      prenom: d.get('prenom').trim(),
      objectif: d.get('objectif').trim(),
      semaine: Number(d.get('semaine')) || 1,
      semaines_total: Number(d.get('semaines_total')) || 12,
      prochain_bilan: d.get('prochain_bilan') || null,
      message_coach: d.get('message_coach').trim(),
      competitrice: d.get('competitrice') === 'on'
    }));
    toast('Fiche enregistrée.');
    recharger();
  });
}

function ligneRepas(r = {}) {
  return `<div class="ligne-repas">
    <input name="heure" value="${esc(r.heure || '')}" placeholder="7h30" aria-label="Heure">
    <input name="nom" value="${esc(r.nom || '')}" placeholder="Petit-déjeuner" aria-label="Repas">
    <input name="details" value="${esc(r.details || '')}" placeholder="Aliments et quantités" aria-label="Détails">
    <button type="button" class="bouton-icone" data-suppr aria-label="Supprimer ce repas">${icone('poubelle', 18)}</button>
  </div>`;
}

async function ficheNutrition(zone, e, recharger) {
  const n = (await api.getNutrition(e.id)) || { repas: [] };
  const nb = (nom, libelle, val) => `<label>${libelle}<input name="${nom}" type="number" min="0" value="${val ?? ''}"></label>`;
  zone.innerHTML = `<form class="formulaire carte large" id="form-nutri">
    <div class="grille-3">
      <label>Type de jour<input name="type_jour" value="${esc(n.type_jour || 'Jour entraînement')}"></label>
      ${nb('kcal', 'Calories (kcal)', n.kcal)}
    </div>
    <div class="grille-3">${nb('proteines', 'Protéines (g)', n.proteines)}${nb('glucides', 'Glucides (g)', n.glucides)}${nb('lipides', 'Lipides (g)', n.lipides)}</div>
    <div class="surtitre-carte">REPAS</div>
    <div id="repas">${(n.repas.length ? n.repas : [{}]).map(ligneRepas).join('')}</div>
    <button type="button" class="bouton-contour" id="ajout-repas">${icone('plus', 18)}Ajouter un repas</button>
    <div class="grille-3">
      <label class="deux-colonnes">Dernier ajustement<input name="ajustement" value="${esc(n.ajustement || '')}" placeholder="Ex. : +100 kcal les jours d'entraînement"></label>
      <label>Date<input name="ajustement_date" type="date" value="${esc(n.ajustement_date || '')}"></label>
    </div>
    <label>Plan complet en PDF ${n.pdf_chemin ? '(un PDF est déjà en ligne, en choisir un autre le remplace)' : '(facultatif)'}<input name="pdf" type="file" accept="application/pdf"></label>
    <button class="bouton-principal" type="submit">ENREGISTRER LE PLAN</button>
  </form>`;

  const liste = zone.querySelector('#repas');
  zone.querySelector('#ajout-repas').addEventListener('click', () => liste.insertAdjacentHTML('beforeend', ligneRepas()));
  liste.addEventListener('click', (ev) => ev.target.closest('[data-suppr]')?.parentElement.remove());

  zone.querySelector('form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const d = new FormData(ev.target);
    const num = (k) => (d.get(k) === '' ? null : Number(d.get(k)));
    const repas = [...liste.querySelectorAll('.ligne-repas')]
      .map((l) => ({ heure: l.querySelector('[name=heure]').value.trim(), nom: l.querySelector('[name=nom]').value.trim(), details: l.querySelector('[name=details]').value.trim() }))
      .filter((r) => r.nom || r.details);
    const pdf = d.get('pdf')?.size ? d.get('pdf') : null;
    await pendant(ev.submitter, 'Enregistrement…', () => api.saveNutrition(e.id, {
      type_jour: d.get('type_jour').trim(), kcal: num('kcal'), proteines: num('proteines'), glucides: num('glucides'),
      lipides: num('lipides'), repas, ajustement: d.get('ajustement').trim(), ajustement_date: d.get('ajustement_date') || null
    }, pdf));
    toast('Plan nutrition enregistré.');
    recharger();
  });
}

// Carte vidéo côté coach : lecture + zone de correction
function carteCorrection(v, avecPrenom) {
  const corrige = v.statut === 'corrige';
  return `<article class="carte correction">
    <button class="vignette" data-video="${esc(v.id)}" aria-label="Voir la vidéo ${esc(v.exercice)}">${icone('lecture', 20, '#E3C8FF', true)}</button>
    <div class="correction-texte">
      <div class="ligne-entre"><strong>${avecPrenom ? `${esc(v.prenom || '')} · ` : ''}${esc(v.exercice)}</strong>
        ${corrige ? badge('Corrigé', VERT) : badge(v.type === 'posing' ? 'Posing à corriger' : 'À corriger', ORANGE)}</div>
      <div class="petit">Envoyée le ${dateCourte(v.created_at)}</div>
      <form class="formulaire-ligne" data-corriger="${esc(v.id)}">
        <textarea name="retour" rows="2" placeholder="Ton retour : placement, amplitude, respiration…" aria-label="Ton retour">${esc(v.retour || '')}</textarea>
        <label class="choix-video">${icone('video', 18, 'var(--accent)')}<span>${v.retour_chemin ? 'Remplacer ma vidéo de correction' : 'Ajouter une vidéo de correction (facultatif)'}</span>
          <input type="file" name="fichier" accept="video/*"></label>
        <div class="actions-correction">
          ${v.retour_chemin ? `<button type="button" class="bouton-contour compact" data-voir-correction="${esc(v.id)}">${icone('lecture', 16)}Voir ma vidéo</button>` : ''}
          <button class="bouton-principal compact" type="submit">${corrige ? 'MODIFIER' : 'ENVOYER LA CORRECTION'}</button>
        </div>
      </form>
    </div></article>`;
}

function brancherCorrections(zone, videos, apres) {
  zone.querySelectorAll('[data-video]').forEach((b) => b.addEventListener('click', async () => {
    const v = videos.find((x) => x.id === b.dataset.video);
    const url = await api.mediaUrl(v.chemin);
    fenetre(`${v.prenom || ''} · ${v.exercice}`, url
      ? `<video src="${esc(url)}" controls playsinline class="lecteur"></video>`
      : '<p class="vide">Pas de fichier vidéo pour cet exemple de démo.</p>');
  }));
  zone.querySelectorAll('[data-voir-correction]').forEach((b) => b.addEventListener('click', async () => {
    const v = videos.find((x) => x.id === b.dataset.voirCorrection);
    const url = await api.mediaUrl(v.retour_chemin);
    fenetre(`Ma correction · ${v.exercice}`, url
      ? `<video src="${esc(url)}" controls playsinline class="lecteur"></video>`
      : '<p class="vide">Vidéo indisponible.</p>');
  }));
  zone.querySelectorAll('.choix-video input').forEach((entree) => entree.addEventListener('change', () => {
    const choisie = entree.files[0];
    entree.parentElement.classList.toggle('choisie', !!choisie);
    if (choisie) entree.previousElementSibling.textContent = choisie.name;
  }));
  zone.querySelectorAll('[data-corriger]').forEach((f) => f.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const v = videos.find((x) => x.id === f.dataset.corriger);
    const d = new FormData(f);
    const retour = d.get('retour').trim();
    const fichier = d.get('fichier')?.size ? d.get('fichier') : null;
    if (!retour && !fichier && !v.retour_chemin) {
      toast('Écris un retour ou ajoute une vidéo de correction.', true);
      return;
    }
    if (fichier && fichier.size > 50 * 1024 * 1024) {
      toast('Vidéo trop lourde (50 Mo max). Coupe-la ou réduis la qualité.', true);
      return;
    }
    await pendant(ev.submitter, fichier ? 'Envoi de la vidéo…' : 'Envoi…', () => api.correctVideo(v.id, retour, fichier, v.eleve_id));
    toast('Correction envoyée.');
    apres();
  }));
}

async function ficheVideos(zone, e, recharger) {
  const videos = await api.listVideos({ eleveId: e.id });
  zone.innerHTML = `<div class="pile">${videos.map((v) => carteCorrection(v, false)).join('') || '<p class="vide">Aucune vidéo envoyée.</p>'}</div>`;
  brancherCorrections(zone, videos, recharger);
}

function carteBilan(b, precedent) {
  const delta = (cle, unite) => (precedent && b[cle] != null && precedent[cle] != null ? ` <small class="lilas">${ecart(b[cle] - precedent[cle])} ${unite}</small>` : '');
  return `<article class="carte bilan${b.lu ? '' : ' non-lu'}">
    <div class="ligne-entre"><strong>${b.prenom ? `${esc(b.prenom)} · ` : ''}Bilan du ${dateCourte(b.date)}</strong>
      ${b.lu ? badge('Lu', GRIS) : `<button class="bouton-contour compact" data-lu="${esc(b.id)}">Marquer comme lu</button>`}</div>
    <div class="grille-4 petit">
      <span>Poids <strong>${nombre(b.poids)} kg</strong>${delta('poids', 'kg')}</span>
      <span>Taille <strong>${nombre(b.taille)} cm</strong>${delta('taille', 'cm')}</span>
      <span>Hanches <strong>${nombre(b.hanches)} cm</strong>${delta('hanches', 'cm')}</span>
      <span>Cuisse <strong>${nombre(b.cuisse)} cm</strong>${delta('cuisse', 'cm')}</span>
    </div>
    ${b.ressenti ? `<p class="texte">« ${esc(b.ressenti)} »</p>` : ''}
    ${b.photo_face || b.photo_profil || b.photo_dos ? `<div class="grille-3">${['face', 'profil', 'dos'].map((c) =>
      `<figure class="photo"><div class="photo-cadre" data-chemin="${esc(b[`photo_${c}`] || '')}">—</div><figcaption>${c}</figcaption></figure>`).join('')}</div>` : ''}
  </article>`;
}

function brancherLu(zone, apres) {
  zone.querySelectorAll('[data-lu]').forEach((b) => b.addEventListener('click', async () => {
    await pendant(b, '…', () => api.markBilanLu(b.dataset.lu));
    apres();
  }));
}

async function ficheBilans(zone, e, recharger) {
  const bilans = await api.listBilans(e.id);
  const cartes = bilans.map((b, i) => carteBilan(b, bilans[i - 1])).reverse().join('');
  zone.innerHTML = `${bilans.length > 1 ? `<section class="carte large"><div class="surtitre-carte">POIDS</div>${courbe(bilans.map((b) => ({ valeur: b.poids })), { largeur: 640, hauteur: 140 })}</section>` : ''}
    <div class="pile">${cartes || '<p class="vide">Aucun bilan pour le moment.</p>'}</div>`;
  brancherLu(zone, recharger);
  afficherPhotos(zone);
}

async function ficheCharges(zone, e) {
  zone.innerHTML = '<div class="large" id="charges-eleve"></div>';
  await blocCharges(zone.querySelector('#charges-eleve'), e.id, false);
}

// Training : programmes d'entraînement de l'élève (le plus récent = programme en cours)
async function ficheTraining(zone, e, recharger) {
  const programmes = await api.listProgrammes(e.id);
  zone.innerHTML = `<div class="pile large">
    <button class="bouton-principal" id="ajouter-programme">${icone('plus', 18)}AJOUTER UN PROGRAMME</button>
    <p class="petit">Le dernier programme ajouté devient le « programme en cours » de ${esc(e.prenom)}. Les précédents restent consultables.
      Elle voit un badge « Nouveau » dans son onglet Plan.</p>
    ${programmes.map((p, i) => carteProgramme(p, { enCours: i === 0, modifiable: true })).join('')
      || `<p class="vide">Aucun programme pour ${esc(e.prenom)}. Ajoute son premier training !</p>`}
  </div>`;
  zone.querySelector('#ajouter-programme').addEventListener('click', () => formulaireProgramme(e, null, recharger));
  zone.querySelectorAll('[data-modifier-prog]').forEach((b) => b.addEventListener('click', () =>
    formulaireProgramme(e, programmes.find((p) => p.id === b.dataset.modifierProg), recharger)));
  zone.querySelectorAll('[data-supprimer-prog]').forEach((b) => b.addEventListener('click', async () => {
    const p = programmes.find((x) => x.id === b.dataset.supprimerProg);
    if (!confirm(`Supprimer « ${p.titre} » ? ${e.prenom} ne le verra plus.`)) return;
    await pendant(b, '…', () => api.deleteProgramme(p.id));
    toast('Programme supprimé.');
    recharger();
  }));
  brancherFichiers(zone);
}

function formulaireProgramme(e, p, recharger) {
  const f = fenetre(p ? 'Modifier le programme' : `Programme de ${e.prenom}`, `<form class="formulaire">
    <label>Titre<input name="titre" required value="${esc(p?.titre || '')}" placeholder="Ex. : Bloc 2 · Semaines 5 à 8"></label>
    <label>Consignes / séances (facultatif)<textarea name="description" rows="5" placeholder="Ex. : Séance A : Hip thrust 4×8, Squat bulgare 3×10…">${esc(p?.description || '')}</textarea></label>
    <div class="surtitre-carte">LE FICHIER DU PROGRAMME</div>
    <label class="choix-video">${icone('doc', 18, 'var(--accent)')}<span>${p?.chemin ? `Remplacer « ${esc(p.nom_fichier || 'le fichier')} »` : 'Choisir un fichier (PDF, image, Excel, Word…)'}</span>
      <input type="file" name="fichier" accept=".pdf,image/*,.xls,.xlsx,.csv,.numbers,.doc,.docx,.pages"></label>
    <label>Ou un lien (Google Drive, Google Sheets…)<input name="lien" type="url" inputmode="url" value="${esc(p?.lien || '')}" placeholder="https://…"></label>
    <p class="petit">Astuce : le PDF est le format le plus pratique, il s'ouvre sur tous les téléphones.</p>
    <button class="bouton-principal" type="submit">${p ? 'ENREGISTRER' : 'ENVOYER LE PROGRAMME'}</button>
  </form>`);
  const entree = f.querySelector('[name=fichier]');
  entree.addEventListener('change', () => {
    entree.parentElement.classList.toggle('choisie', !!entree.files[0]);
    if (entree.files[0]) entree.previousElementSibling.textContent = entree.files[0].name;
  });
  f.querySelector('form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const d = new FormData(ev.target);
    const fichier = d.get('fichier')?.size ? d.get('fichier') : null;
    const lien = d.get('lien').trim();
    const description = d.get('description').trim();
    if (!fichier && !lien && !description && !p?.chemin) { toast('Ajoute un fichier, un lien ou des consignes.', true); return; }
    if (lien && !lienValide(lien)) { toast('Le lien doit commencer par https://', true); return; }
    if (fichier && fichier.size > 50 * 1024 * 1024) { toast('Fichier trop lourd (50 Mo max).', true); return; }
    await pendant(ev.submitter, fichier ? 'Envoi du fichier…' : 'Enregistrement…', () => api.saveProgramme(p?.id, e.id, {
      titre: d.get('titre').trim(), description: description || null, lien: lien || null
    }, fichier));
    fermerFenetre();
    toast(p ? 'Programme modifié.' : `Programme envoyé à ${e.prenom} !`);
    recharger();
  });
}

async function ficheCompetition(zone, e, recharger) {
  const c = (await api.getCompetition(e.id)) || { poses: [], checklist: [] };
  zone.innerHTML = `<form class="formulaire carte large" id="form-compet">
    <div class="grille-3">
      <label class="deux-colonnes">Nom de la compétition<input name="nom" value="${esc(c.nom || '')}"></label>
      <label>Catégorie<input name="categorie" value="${esc(c.categorie || '')}" placeholder="Wellness, Bikini…"></label>
    </div>
    <div class="grille-3">
      <label>Date<input name="date_compet" type="date" value="${esc(c.date_compet || '')}"></label>
      <label class="deux-colonnes">Ville<input name="ville" value="${esc(c.ville || '')}"></label>
    </div>
    <label>Poses imposées (une par ligne)<textarea name="poses" rows="4">${esc(c.poses.map((p) => p.nom).join('\n'))}</textarea></label>
    <label>Checklist jour J (une tâche par ligne)<textarea name="checklist" rows="4">${esc(c.checklist.map((t) => t.label).join('\n'))}</textarea></label>
    <button class="bouton-principal" type="submit">ENREGISTRER</button>
  </form>`;
  zone.querySelector('form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const d = new FormData(ev.target);
    const lignes = (k) => d.get(k).split('\n').map((l) => l.trim()).filter(Boolean);
    const dejaFait = new Map(c.checklist.map((t) => [t.label, t.fait]));
    await pendant(ev.submitter, 'Enregistrement…', () => api.saveCompetition(e.id, {
      nom: d.get('nom').trim(), categorie: d.get('categorie').trim(), date_compet: d.get('date_compet') || null,
      ville: d.get('ville').trim(),
      poses: lignes('poses').map((nom) => ({ nom })),
      checklist: lignes('checklist').map((label) => ({ label, fait: dejaFait.get(label) || false }))
    }));
    toast('Compétition enregistrée.');
    recharger();
  });
}

// ───────────── Pages du menu ─────────────
let voirCorrigees = false;
async function videos(racine, profil) {
  const liste = await api.listVideos(voirCorrigees ? {} : { statut: 'a_corriger' });
  racine.innerHTML = page(profil, 'coach/videos', titre('Vidéos à corriger') + `
    <div class="filtres">
      <button class="filtre${voirCorrigees ? '' : ' actif'}" data-voir="non">À corriger</button>
      <button class="filtre${voirCorrigees ? ' actif' : ''}" data-voir="oui">Toutes</button>
    </div>
    <div class="pile">${liste.map((v) => carteCorrection(v, true)).join('') || '<p class="vide">Rien à corriger, bravo !</p>'}</div>`);
  racine.querySelectorAll('[data-voir]').forEach((b) => b.addEventListener('click', () => {
    voirCorrigees = b.dataset.voir === 'oui';
    videos(racine, profil);
  }));
  brancherCorrections(racine, liste, () => videos(racine, profil));
}

async function bilans(racine, profil) {
  const tous = await api.listBilans();
  const precedent = (b) => tous.filter((x) => x.eleve_id === b.eleve_id && x.date < b.date).pop();
  const tries = [...tous].sort((a, b) => (a.lu - b.lu) || b.date.localeCompare(a.date));
  racine.innerHTML = page(profil, 'coach/bilans', titre('Bilans') +
    `<div class="pile">${tries.map((b) => carteBilan(b, precedent(b))).join('') || '<p class="vide">Aucun bilan reçu.</p>'}</div>`);
  brancherLu(racine, () => bilans(racine, profil));
  afficherPhotos(racine);
}

async function competitrices(racine, profil) {
  const eleves = (await api.listEleves()).filter((e) => e.competitrice);
  const compets = await Promise.all(eleves.map((e) => api.getCompetition(e.id)));
  const cartes = eleves.map((e, i) => {
    const c = compets[i];
    const j = c?.date_compet ? joursAvant(c.date_compet) : null;
    const faits = c?.checklist?.filter((t) => t.fait).length || 0;
    return `<a href="#/coach/eleve/${esc(e.id)}/competition" class="carte carte-compet">
      <div class="ligne-auteur">${initiale(e.prenom)}<div><strong>${esc(e.prenom)}</strong>
        <div class="petit">${esc(c?.nom || 'Compétition à définir')}${c?.categorie ? ` · ${esc(c.categorie)}` : ''}</div>
        <div class="petit">Checklist : ${faits} / ${c?.checklist?.length || 0}</div></div></div>
      ${j !== null ? `<div class="compte-rebours"><div>${j >= 0 ? `J-${j}` : 'Fait'}</div><small>AVANT LA SCÈNE</small></div>` : ''}
    </a>`;
  }).join('');
  racine.innerHTML = page(profil, 'coach/competitrices', titre('Compétitrices') +
    `<div class="pile">${cartes || '<p class="vide">Aucune compétitrice. Coche « Compétitrice » dans la fiche d\'une élève.</p>'}</div>`);
}

async function plansNutrition(racine, profil) {
  const eleves = await api.listEleves();
  const plans = await Promise.all(eleves.map((e) => api.getNutrition(e.id)));
  const lignes = eleves.map((e, i) => {
    const n = plans[i];
    return `<a href="#/coach/eleve/${esc(e.id)}/nutrition" class="tableau-ligne">
      <span class="cellule-nom">${initiale(e.prenom)}<strong>${esc(e.prenom)}</strong></span>
      <span class="gris">${n ? `${nombre(n.kcal, 0)} kcal` : 'Pas de plan'}</span>
      <span class="gris">${n ? `P ${nombre(n.proteines, 0)} · G ${nombre(n.glucides, 0)} · L ${nombre(n.lipides, 0)}` : ''}</span>
      <span class="gris">${n?.ajustement_date ? `Ajusté le ${dateCourte(n.ajustement_date)}` : ''}</span>
      <span class="gris" aria-hidden="true">${icone('chevron', 20)}</span>
    </a>`;
  }).join('');
  racine.innerHTML = page(profil, 'coach/nutrition', titre('Plans nutrition') + `
    <section class="carte tableau">
      <div class="tableau-tete"><span>ÉLÈVE</span><span>CALORIES</span><span>MACROS</span><span>AJUSTEMENT</span><span></span></div>
      ${lignes || '<p class="vide">Aucune élève.</p>'}
    </section>`);
}

// Vue d'ensemble des charges de toutes les élèves
async function suiviCharges(racine, profil) {
  const [eleves, charges] = await Promise.all([api.listEleves(), api.listCharges()]);
  const lignes = eleves.map((e) => {
    const siennes = charges.filter((c) => c.eleve_id === e.id);
    const parExo = new Map();
    for (const c of siennes) {
      if (!parExo.has(c.exercice)) parExo.set(c.exercice, []);
      parExo.get(c.exercice).push(c);
    }
    // Records battus ces 7 derniers jours
    let records = 0;
    let meilleure = null;
    for (const [exercice, liste] of parExo) {
      liste.forEach((c, i) => {
        const avant = liste.slice(0, i).map((x) => Number(x.poids));
        if (avant.length && Number(c.poids) > Math.max(...avant) && joursAvant(c.date) >= -7) records += 1;
      });
      const gain = Number(liste[liste.length - 1].poids) - Number(liste[0].poids);
      if (liste.length > 1 && (!meilleure || gain > meilleure.gain)) meilleure = { exercice, gain };
    }
    const derniere = siennes.length ? siennes[siennes.length - 1].date : null;
    return { e, derniere, nbExos: parExo.size, records, meilleure };
  }).sort((a, b) => (b.derniere || '').localeCompare(a.derniere || ''));

  const html = lignes.map(({ e, derniere, nbExos, records, meilleure }) => `
    <a href="#/coach/eleve/${esc(e.id)}/charges" class="tableau-ligne">
      <span class="cellule-nom">${initiale(e.prenom)}<strong>${esc(e.prenom)}</strong>
        ${records ? badge(`${records} RECORD${records > 1 ? 'S' : ''} CETTE SEMAINE`, VERT) : ''}</span>
      <span class="gris">${derniere ? `Dernière séance : ${dateCourte(derniere)}` : 'Aucune charge notée'}</span>
      <span class="gris">${nbExos ? `${nbExos} exercice${nbExos > 1 ? 's' : ''}` : ''}</span>
      <span class="gris">${meilleure && meilleure.gain > 0 ? `${esc(meilleure.exercice)} <strong class="vert">${ecart(meilleure.gain)} kg</strong>` : ''}</span>
      <span class="gris" aria-hidden="true">${icone('chevron', 20)}</span>
    </a>`).join('');

  racine.innerHTML = page(profil, 'coach/charges', titre('Suivi des charges') + `
    <p class="gris">Clique sur une élève pour voir le détail de ses charges exercice par exercice, avec la courbe et l'historique.</p>
    <section class="carte tableau">
      <div class="tableau-tete"><span>ÉLÈVE</span><span>DERNIÈRE SÉANCE</span><span>EXERCICES</span><span>MEILLEURE PROGRESSION</span><span></span></div>
      ${html || '<p class="vide">Aucune élève.</p>'}
    </section>`);
}

// ───────────── Messages ─────────────
function apercu(m) {
  if (!m) return 'Aucun message';
  const qui = m.de_coach ? 'Toi : ' : '';
  return qui + (m.texte ? m.texte : 'Message vocal');
}

async function messages(racine, profil, [eleveId]) {
  if (eleveId) return discussion(racine, profil, eleveId);
  const [eleves, tous] = await Promise.all([api.listEleves(), api.listMessages()]);
  const lignes = eleves.map((e) => {
    const siens = tous.filter((m) => m.eleve_id === e.id);
    return { e, dernier: siens[siens.length - 1], nonLus: siens.filter((m) => !m.de_coach && !m.lu).length };
  }).sort((a, b) => (b.nonLus - a.nonLus) || (b.dernier?.created_at || '').localeCompare(a.dernier?.created_at || ''));

  racine.innerHTML = page(profil, 'coach/messages', titre('Messages') + `
    <section class="carte liste-conversations">
      ${lignes.map(({ e, dernier, nonLus }) => `
        <a href="#/coach/messages/${esc(e.id)}" class="ligne-conversation${nonLus ? ' non-lue' : ''}">
          ${initiale(e.prenom)}
          <span class="ligne-conversation-texte"><strong>${esc(e.prenom)}</strong>
            <span class="petit">${esc(apercu(dernier))}</span></span>
          <span class="ligne-conversation-info">
            ${dernier ? `<small class="petit">${dateCourte(dernier.created_at)}</small>` : ''}
            ${nonLus ? `<span class="compteur">${nonLus}</span>` : ''}
          </span>
        </a>`).join('') || '<p class="vide">Aucune élève inscrite.</p>'}
    </section>`);
}

async function discussion(racine, profil, eleveId) {
  const e = await api.getProfile(eleveId);
  if (!e) { location.hash = '#/coach/messages'; return; }
  racine.innerHTML = page(profil, 'coach/messages', `
    <div class="bureau-tete"><div class="ligne-auteur">
      <a href="#/coach/messages" class="bouton-rond" aria-label="Retour aux messages">${icone('retour', 20)}</a>
      <div><div class="surtitre">MESSAGES</div><h1>${esc(e.prenom)}</h1></div></div>
      <a href="#/coach/eleve/${esc(e.id)}" class="bouton-contour compact">Voir sa fiche</a></div>
    <div class="chat-bureau" id="chat-zone"></div>`);
  await conversation(racine.querySelector('#chat-zone'), {
    eleveId, moiCoach: true, titre: e.prenom,
    sousTitre: esc(e.objectif || ''), avatar: initiale(e.prenom)
  });
}

// ───────────── Vidéothèque ─────────────
async function videotheque(racine, profil) {
  const liste = await api.listBibliotheque();
  racine.innerHTML = page(profil, 'coach/videotheque', titre(esc(NOM_VIDEOTHEQUE),
    `<button class="bouton-principal compact" id="ajouter-video">${icone('plus', 18)}AJOUTER UNE VIDÉO</button>`) + `
    <p class="gris">Ces vidéos d'explication sont visibles par toutes tes élèves (onglet Mouvement). Quand tu en ajoutes une,
      elles voient un badge « Nouveau » et une notification dans l'app.</p>
    <div class="grille-biblio bureau-biblio">${liste.map((v) => `
      <article class="carte-biblio">
        <button class="carte-biblio-media" data-voir="${esc(v.id)}" aria-label="Voir ${esc(v.titre)}">${vignette(v)}</button>
        <span class="carte-biblio-texte">
          <strong>${esc(v.titre)}</strong>
          <span class="petit">${esc(v.categorie)} · ajoutée le ${dateCourte(v.created_at)}</span>
          <span class="actions-biblio">
            <button class="bouton-contour compact" data-modifier="${esc(v.id)}">Modifier</button>
            <button class="bouton-icone" data-supprimer="${esc(v.id)}" aria-label="Supprimer ${esc(v.titre)}">${icone('poubelle', 18)}</button>
          </span>
        </span>
      </article>`).join('') || '<p class="vide">Aucune vidéo pour le moment. Ajoute ta première explication !</p>'}
    </div>`);

  const recharger = () => videotheque(racine, profil);
  racine.querySelector('#ajouter-video').addEventListener('click', () => formulaireBiblio(null, recharger));
  racine.querySelectorAll('[data-voir]').forEach((b) => b.addEventListener('click', () => ouvrirVideo(liste.find((v) => v.id === b.dataset.voir))));
  racine.querySelectorAll('[data-modifier]').forEach((b) => b.addEventListener('click', () => formulaireBiblio(liste.find((v) => v.id === b.dataset.modifier), recharger)));
  racine.querySelectorAll('[data-supprimer]').forEach((b) => b.addEventListener('click', async () => {
    const v = liste.find((x) => x.id === b.dataset.supprimer);
    if (!confirm(`Supprimer « ${v.titre} » ? Tes élèves ne la verront plus.`)) return;
    await pendant(b, '…', () => api.deleteBibliotheque(v.id));
    toast('Vidéo supprimée.');
    recharger();
  }));
  chargerMiniatures(racine);
}

function formulaireBiblio(v, recharger) {
  const f = fenetre(v ? 'Modifier la vidéo' : 'Ajouter une vidéo', `<form class="formulaire">
    <label>Titre<input name="titre" required value="${esc(v?.titre || '')}" placeholder="Ex. : Hip thrust, placement du bassin"></label>
    <label>Catégorie<select name="categorie">${CATEGORIES.map((c) => `<option${c === (v?.categorie || 'Fessiers') ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select></label>
    <label>Explication (facultatif)<textarea name="description" rows="3" placeholder="Les points clés à retenir">${esc(v?.description || '')}</textarea></label>
    <div class="surtitre-carte">LA VIDÉO</div>
    <label class="choix-video">${icone('video', 18, 'var(--accent)')}<span>${v?.chemin ? 'Remplacer la vidéo envoyée' : 'Choisir une vidéo sur mon appareil (50 Mo max)'}</span>
      <input type="file" name="fichier" accept="video/*"></label>
    <label>Ou un lien YouTube / Vimeo<input name="lien" type="url" inputmode="url" value="${esc(v?.lien || '')}" placeholder="https://youtu.be/…"></label>
    <p class="petit">Astuce : pour une vidéo longue (plus de 50 Mo), mets-la sur YouTube en « Non répertoriée » et colle le lien ici.</p>
    <button class="bouton-principal" type="submit">${v ? 'ENREGISTRER' : 'PUBLIER LA VIDÉO'}</button>
  </form>`);
  const entree = f.querySelector('[name=fichier]');
  entree.addEventListener('change', () => {
    entree.parentElement.classList.toggle('choisie', !!entree.files[0]);
    if (entree.files[0]) entree.previousElementSibling.textContent = entree.files[0].name;
  });
  f.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = new FormData(e.target);
    const fichier = d.get('fichier')?.size ? d.get('fichier') : null;
    const lien = d.get('lien').trim();
    if (!fichier && !lien && !v?.chemin) { toast('Choisis une vidéo ou colle un lien.', true); return; }
    if (lien && !lienValide(lien)) { toast('Le lien doit commencer par https://', true); return; }
    if (fichier && fichier.size > 50 * 1024 * 1024) {
      toast('Vidéo trop lourde (50 Mo max). Utilise plutôt un lien YouTube non répertorié.', true);
      return;
    }
    await pendant(e.submitter, fichier ? 'Envoi de la vidéo…' : 'Enregistrement…', () => api.saveBibliotheque(v?.id, {
      titre: d.get('titre').trim(), categorie: d.get('categorie'), description: d.get('description').trim(), lien: lien || null
    }, fichier));
    fermerFenetre();
    toast(v ? 'Vidéo modifiée.' : 'Vidéo publiée ! Tes élèves vont la voir apparaître.');
    recharger();
  });
}

export const ecransCoach = { tableau, fiche, videos, bilans, competitrices, plansNutrition, suiviCharges, messages, videotheque };
