// ESPACE COACH — tableau de bord, fiches élèves, corrections vidéo, bilans, compétitrices.
import { api, MODE } from './data.js';
import {
  esc, icone, dateCourte, joursAvant, nombre, ecart, badge,
  toast, fenetre, fermerFenetre, pendant, courbe
} from './ui.js';
import { afficherPhotos } from './eleve.js';

const VERT = '#7FE0B8';
const ORANGE = '#FFB86B';
const GRIS = '#BCA8DE';

const MENU = [
  { route: 'coach', libelle: 'Mes élèves', icone: 'eleves' },
  { route: 'coach/nutrition', libelle: 'Plans nutrition', icone: 'nutrition' },
  { route: 'coach/videos', libelle: 'Vidéos à corriger', icone: 'video' },
  { route: 'coach/competitrices', libelle: 'Compétitrices', icone: 'etoile' },
  { route: 'coach/bilans', libelle: 'Bilans', icone: 'progres' }
];

function page(profil, actif, contenu) {
  const liens = MENU.map((m) => {
    const on = m.route === actif;
    return `<a href="#/${m.route}" class="menu-lien${on ? ' actif' : ''}"${on ? ' aria-current="page"' : ''}>${icone(m.icone, 20)}<span>${m.libelle}</span></a>`;
  }).join('');
  return `<div class="bureau">
    <aside class="barre-laterale">
      <img src="img/logo.jpg" alt="Booty Flow Coaching" class="logo-lateral">
      <nav aria-label="Menu coach">${liens}</nav>
      <button class="menu-lien deconnexion" id="deconnexion">${icone('sortie', 20)}<span>Se déconnecter</span></button>
    </aside>
    <main class="bureau-contenu">${contenu}</main>
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
const ONGLETS_FICHE = [['suivi', 'Suivi'], ['nutrition', 'Nutrition'], ['videos', 'Vidéos'], ['bilans', 'Bilans'], ['competition', 'Compétition']];

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
      <span class="petit">${esc(e.email || '')}</span></div>
    <div class="filtres">${onglets}</div>
    <div id="onglet"></div>
  `);
  const zone = racine.querySelector('#onglet');
  const recharger = () => fiche(racine, profil, [eleveId, onglet]);
  await ({ suivi: ficheSuivi, nutrition: ficheNutrition, videos: ficheVideos, bilans: ficheBilans, competition: ficheCompetition }[onglet] || ficheSuivi)(zone, e, recharger);
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
        <textarea name="retour" rows="2" required placeholder="Ton retour : placement, amplitude, respiration…" aria-label="Ton retour">${esc(v.retour || '')}</textarea>
        <button class="bouton-principal compact" type="submit">${corrige ? 'MODIFIER' : 'ENVOYER LA CORRECTION'}</button>
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
  zone.querySelectorAll('[data-corriger]').forEach((f) => f.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    await pendant(ev.submitter, 'Envoi…', () => api.correctVideo(f.dataset.corriger, new FormData(f).get('retour').trim()));
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

export const ecransCoach = { tableau, fiche, videos, bilans, competitrices, plansNutrition };
