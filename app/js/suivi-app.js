// BOOTY FLOW APP — pesée de la semaine, courbe de poids et ajustement automatique du plan alimentaire.
import { api } from './data.js';
import { esc, icone, toast, pendant, dateCourte, nombre, courbe, joursAvant, fenetre, fermerFenetre, compresserImage, ecart } from './ui.js';
import { page, entete, blocCharges } from './eleve.js';
import { encartCoaching } from './formules.js';
import { NOM_COACH } from './config.js';
import { retourBilanHtml, brancherRetours, retourEstNouveau, marquerRetoursVus } from './bilans.js';
import { videoPrete } from './compression.js';
import { enregistreurVocal } from './vocal.js';
import { page as pageCoach } from './coach.js';

const signe = (v, dec = 1) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${nombre(Math.abs(v), dec)}`;

// « −30 g de glucides par jour (≈ 100 g de riz cuit) »
export function texteAjustement(g) {
  if (!g) return 'Aucun ajustement en cours';
  const riz = Math.round((Math.abs(g) / 0.28) / 50) * 50;
  return `${signe(g, 0)} g de glucides par jour${riz ? ` (≈ ${g > 0 ? '+' : '−'}${riz} g de riz cuit)` : ''}`;
}

export function messageDecision(r) {
  if (!r || !r.delta) return null;
  return r.delta > 0
    ? `Ton plan alimentaire passe à ${texteAjustement(r.total)} : ${r.raison}. On ajoute des glucides pour avancer au bon rythme.`
    : `Ton plan alimentaire passe à ${texteAjustement(r.total)} : ${r.raison}. On retire un peu de glucides pour relancer ta progression.`;
}

// Vitesse sur la dernière semaine (kg / semaine) : dernière pesée comparée à celle d'au moins 7 jours avant
export function vitesseRecente(pesees) {
  const derniere = pesees[pesees.length - 1];
  if (!derniere) return null;
  const ecart = (a, b) => Math.round((new Date(`${a}T12:00:00`) - new Date(`${b}T12:00:00`)) / 864e5);
  const ref = [...pesees].reverse().find((p) => ecart(derniere.date, p.date) >= 7 && ecart(derniere.date, p.date) <= 21);
  return ref ? (derniere.poids - ref.poids) / (ecart(derniere.date, ref.date) / 7) : null;
}

// Pesée à faire : aucune pesée, ou la dernière date d'au moins 7 jours
export function peseeAFaire(pesees) {
  const derniere = pesees[pesees.length - 1];
  return !derniere || joursAvant(derniere.date) <= -7;
}

// ───────────── Relevé du mois : mensurations + photos ─────────────
export const MESURES = [['tour_taille', 'Tour de taille'], ['hanches', 'Hanches'], ['fessiers', 'Fessiers'], ['cuisse', 'Cuisse'], ['bras', 'Bras']];
const COTES = [['face', 'Face'], ['profil', 'Profil'], ['dos', 'Dos']];
export const JOURS_ENTRE_RELEVES = 28;
export function releveAFaire(releves) {
  const dernier = releves[releves.length - 1];
  return !dernier || joursAvant(dernier.date) <= -JOURS_ENTRE_RELEVES;
}
const plusJoursIso = (d, n) => { const x = new Date(`${d}T12:00:00`); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };

// Mensurations : dernière valeur et évolution depuis le premier relevé
function grilleMesures(releves) {
  return `<div class="grille-mesures">${MESURES.map(([cle, nom]) => {
    // Dernière valeur mesurée (un relevé peut laisser une mesure vide) et première valeur
    const avec = releves.filter((r) => r[cle] != null);
    const v = avec[avec.length - 1]?.[cle], depart = avec[0]?.[cle];
    const diff = v != null && avec.length > 1 ? Math.round((v - depart) * 10) / 10 : null;
    return `<div class="mesure-app"><span class="petit">${nom}</span><strong>${v != null ? `${nombre(v)} cm` : '—'}</strong>
      ${diff !== null ? `<small class="${diff < 0 ? 'baisse' : diff > 0 ? 'hausse' : ''}">${diff === 0 ? 'stable' : `${ecart(diff)} cm`}</small>` : ''}</div>`;
  }).join('')}</div>`;
}

// Photos avant / après : premier et dernier relevé qui ont la photo
function avantApres(releves, cote) {
  const avec = releves.filter((r) => r[`photo_${cote}`]);
  if (!avec.length) return '<p class="petit">Ajoute tes photos à ton prochain relevé pour voir ton avant / après.</p>';
  const avant = avec[0], apres = avec[avec.length - 1];
  const fig = (r, titre) => `<figure class="photo"><div class="photo-cadre" data-media="${esc(r[`photo_${cote}`])}">Photo</div><figcaption>${titre} · ${dateCourte(r.date)}</figcaption></figure>`;
  return `<div class="grille-2">${fig(avant, 'Avant')}${avant === apres ? '' : fig(apres, 'Maintenant')}</div>`;
}
export async function chargerMedias(zone) {
  for (const el of zone.querySelectorAll('[data-media]')) {
    const url = await api.mediaUrl(el.dataset.media);
    if (url) el.innerHTML = `<img src="${esc(url)}" alt="" loading="lazy">`;
    else el.textContent = 'Photo (démo)';
  }
}

function formulaireReleve(apres) {
  const f = fenetre('Mon bilan du mois', `<form class="formulaire" id="form-releve">
    <p class="petit">Une fois par mois : tes mensurations, tes photos, ton ressenti et ta question technique. ${esc(NOM_COACH)} te répond personnellement.</p>
    <div class="surtitre-carte">MES MENSURATIONS</div>
    <p class="petit">Au mètre ruban, le matin, au même endroit à chaque fois. Laisse vide ce que tu ne mesures pas.</p>
    <div class="grille-2">${MESURES.map(([cle, nom]) => `<label>${nom}<span class="avec-unite"><input name="${cle}" type="number" inputmode="decimal" step="0.5" min="10" max="200"><em>cm</em></span></label>`).join('')}</div>
    <div class="surtitre-carte">MES PHOTOS (FACULTATIF)</div>
    <p class="petit">Même lumière, même tenue, téléphone à hauteur de taille. Elles ne sont visibles que par toi et ta coach.</p>
    <div class="grille-3">${COTES.map(([cle, nom]) => `<label class="choix-photo">${icone('photo', 22, 'var(--accent)')}<span>${nom}</span><input type="file" name="${cle}" accept="image/*"></label>`).join('')}</div>
    <div class="surtitre-carte">MON MOIS</div>
    <label>Comment s'est passé ton mois ?<textarea name="ressenti" rows="3" placeholder="Énergie, séances, alimentation, motivation…"></textarea></label>
    <div class="surtitre-carte">MA VIDÉO TECHNIQUE (1 PAR MOIS, FACULTATIF)</div>
    <label>Exercice filmé<input name="video_exercice" placeholder="Ex. : Hip thrust"></label>
    <label class="choix-video">${icone('video', 18, 'var(--accent)')}<span>Choisir ma vidéo (50 Mo max)</span><input type="file" name="video" accept="video/*"></label>
    <label>Ma question<textarea name="question" rows="2" placeholder="Ex. : est-ce que je descends assez bas ?"></textarea></label>
    <button class="bouton-principal" type="submit">${icone('envoi', 18)}ENVOYER MON BILAN</button>
  </form>`);
  f.querySelectorAll('.choix-photo input, .choix-video input').forEach((x) => x.addEventListener('change', () => {
    x.parentElement.classList.toggle('choisie', x.files.length > 0);
    if (x.name === 'video' && x.files[0]) x.previousElementSibling.textContent = x.files[0].name;
  }));
  f.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = new FormData(e.target);
    const mesures = Object.fromEntries(MESURES.map(([cle]) => [cle, d.get(cle) === '' ? null : Number(String(d.get(cle)).replace(',', '.'))]));
    const texte = (k) => String(d.get(k) || '').trim() || null;
    Object.assign(mesures, { ressenti: texte('ressenti'), question: texte('question'), video_exercice: texte('video_exercice') });
    const photos = {};
    for (const [cle] of COTES) if (d.get(cle)?.size) photos[cle] = await compresserImage(d.get(cle));
    const fichierVideo = d.get('video')?.size ? d.get('video') : null;
    if (MESURES.every(([cle]) => mesures[cle] === null) && !Object.keys(photos).length && !mesures.ressenti && !mesures.question && !fichierVideo) {
      toast('Remplis au moins une partie de ton bilan.', true); return;
    }
    await pendant(e.submitter, 'Envoi…', async () => api.addReleve(mesures, photos, await videoPrete(fichierVideo, e.submitter)));
    fermerFenetre();
    toast(`Bilan envoyé ! ${NOM_COACH} te répond très vite.`);
    apres();
  });
}

export async function progresAbonnee(racine, profil) {
  const [pesees, ajustements, reglages, releves] = await Promise.all([api.listPesees(profil.id), api.listAjustements(profil.id), api.getNutritionApp(), api.listReleves(profil.id)]);
  const aFaire = releveAFaire(releves);
  const dernierBilan = releves[releves.length - 1];
  const vmax = Number(reglages.coefficients?.vitesse_max_kg_semaine ?? 0.5), stagnation = Number(reglages.coefficients?.seuil_stagnation_kg_semaine ?? 0.1);
  const pa = profil.app || {};
  const derniere = pesees[pesees.length - 1];
  const premiere = pesees[0];
  const vitesse = vitesseRecente(pesees);
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const perte = pa.objectif !== 'prise_de_muscle';
  const rythme = vitesse === null ? null
    : perte ? (vitesse < -vmax ? 'trop rapide' : vitesse > -stagnation ? 'stable' : 'idéal')
    : (vitesse > vmax ? 'trop rapide' : vitesse < stagnation ? 'stable' : 'idéal');

  racine.innerHTML = page(profil, 'progres', entete('MES RÉSULTATS', 'Progression') + `
    <form class="carte formulaire" id="form-pesee">
      <div class="ligne-entre"><div class="surtitre-carte">MA PESÉE DE LA SEMAINE</div>
        ${derniere ? `<span class="petit">Dernière : ${dateCourte(derniere.date)}</span>` : ''}</div>
      <p class="petit">Une fois par semaine, le même jour, le matin à jeun après être passée aux toilettes.
        Ton plan alimentaire s'ajuste tout seul selon l'évolution de ton poids.</p>
      <div class="ligne-pesee">
        <span class="avec-unite"><input name="poids" type="number" inputmode="decimal" step="0.1" min="30" max="250" required
          placeholder="${derniere ? nombre(derniere.poids) : 'Ton poids'}" aria-label="Poids en kg"><em>kg</em></span>
        <button class="bouton-principal compact" type="submit">ENREGISTRER</button>
      </div>
    </form>
    <section class="carte">
      <div class="ligne-entre"><div class="surtitre-carte">MON POIDS</div>
        ${premiere && derniere && premiere !== derniere ? `<span class="badge">${signe(derniere.poids - premiere.poids)} kg depuis le début</span>` : ''}</div>
      ${courbe(pesees.map((p) => ({ valeur: p.poids, date: p.date })), { vide: 'La courbe apparaîtra après ta deuxième pesée.' })}
      ${vitesse !== null ? `<p class="petit">Rythme de la dernière semaine : <strong>${signe(vitesse, 2)} kg</strong>
        ${rythme === 'idéal' ? '· parfait, continue comme ça !' : rythme === 'trop rapide' ? `· un peu trop rapide (objectif : pas plus de ${nombre(vmax * 1000, 0)} g ${perte ? 'perdus' : 'pris'} par semaine)` : `· ton poids ne bouge pas`}</p>` : ''}
    </section>
    <section class="carte${aFaire ? ' releve-du' : ''}">
      <div class="ligne-entre"><div class="surtitre-carte">MON BILAN DU MOIS</div>
        <span class="petit">${releves.length ? (aFaire ? 'À faire' : `Prochain le ${dateCourte(plusJoursIso(releves[releves.length - 1].date, JOURS_ENTRE_RELEVES))}`) : ''}</span></div>
      ${releves.length ? grilleMesures(releves) : '<p class="petit">Tes mensurations et tes photos, une fois par mois : la meilleure façon de voir tes fessiers et ta silhouette changer.</p>'}
      ${releves.some((r) => r.tour_taille != null) && releves.length > 1 ? `<div class="petit">Tour de taille</div>${courbe(releves.filter((r) => r.tour_taille != null).map((r) => ({ valeur: r.tour_taille })), { libelle: 'Évolution du tour de taille', unite: 'cm', hauteur: 80 })}` : ''}
      ${releves.length ? `<nav class="segments" aria-label="Photos avant / après">${COTES.map(([cle, nom], i) => `<button class="segment${i === 0 ? ' actif' : ''}" data-cote="${cle}">${nom}</button>`).join('')}</nav>
        <div id="avant-apres">${avantApres(releves, 'face')}</div>` : ''}
      ${dernierBilan ? `<div class="bilan-envoye">
        <div class="surtitre-carte">MON BILAN DU ${esc(dateCourte(dernierBilan.date).toUpperCase())}</div>
        ${dernierBilan.ressenti ? `<p class="texte">${esc(dernierBilan.ressenti)}</p>` : ''}
        ${dernierBilan.question ? `<p class="petit"><strong>Ma question${dernierBilan.video_exercice ? ` (${esc(dernierBilan.video_exercice)})` : ''} :</strong> ${esc(dernierBilan.question)}</p>` : ''}
        ${dernierBilan.video_chemin ? `<button type="button" class="bouton-contour compact" data-video-bilan="${esc(dernierBilan.video_chemin)}">${icone('lecture', 16)}Ma vidéo</button>` : ''}
        ${retourBilanHtml(dernierBilan) || `<p class="petit">En attente de la réponse de ${esc(NOM_COACH)}.</p>`}
      </div>` : ''}
      <button class="${aFaire ? 'bouton-principal' : 'bouton-contour'}" id="nouveau-releve">${icone(aFaire ? 'plus' : 'envoi', 18)}${aFaire ? 'FAIRE MON BILAN DU MOIS' : 'Envoyer un nouveau bilan'}</button>
    </section>
    <section class="carte">
      <div class="surtitre-carte">MON PLAN ALIMENTAIRE</div>
      <p class="texte"><strong>${esc(texteAjustement(pa.ajustement_glucides || 0))}</strong></p>
      ${ajustements.length ? `<ul class="liste-ajustements">${[...ajustements].reverse().slice(0, 6).map((a) => `<li>
        <span>${dateCourte(a.date)}</span><strong>${signe(a.delta, 0)} g de glucides</strong>
        <span class="petit">${esc(a.par_coach ? (a.raison || 'ajustement de ta coach') : `${a.raison}${a.vitesse !== null ? ` (${signe(Number(a.vitesse), 2)} kg / semaine)` : ''}`)}</span></li>`).join('')}</ul>`
        : '<p class="petit">Le premier ajustement possible arrive après deux pesées à une semaine d\'écart.</p>'}
      <a href="#/nutrition" class="lien-chat">${icone('nutrition', 16)}Voir mes journées types</a>
    </section>
    ${pesees.length ? `<details class="carte"><summary class="surtitre-carte">TOUTES MES PESÉES (${pesees.length})</summary>
      <ul class="liste-pesees">${[...pesees].reverse().map((p) => `<li><span>${dateCourte(p.date)}</span><strong>${nombre(p.poids)} kg</strong>
        <button type="button" class="lien" data-supprimer="${esc(p.id)}" aria-label="Supprimer la pesée du ${dateCourte(p.date)}">Supprimer</button></li>`).join('')}</ul>
    </details>` : ''}
    <div id="charges"></div>
    ${encartCoaching('bilans')}`);

  racine.querySelector('#form-pesee').addEventListener('submit', async (e) => {
    e.preventDefault();
    const poids = Number(String(new FormData(e.target).get('poids')).replace(',', '.'));
    const r = await pendant(e.submitter, 'Enregistrement…', () => api.enregistrerPesee(poids));
    if (r?.delta) {
      profil.app = { ...pa, ajustement_glucides: r.total, ajuste_le: aujourdhui };
      toast(messageDecision(r));
    } else toast('Pesée enregistrée, merci !');
    progresAbonnee(racine, profil);
  });
  racine.querySelectorAll('[data-supprimer]').forEach((b) => b.addEventListener('click', async () => {
    await api.supprimerPesee(b.dataset.supprimer);
    progresAbonnee(racine, profil);
  }));
  racine.querySelector('#nouveau-releve').addEventListener('click', () => formulaireReleve(() => progresAbonnee(racine, profil)));
  racine.querySelectorAll('[data-cote]').forEach((b) => b.addEventListener('click', () => {
    racine.querySelectorAll('[data-cote]').forEach((x) => x.classList.toggle('actif', x === b));
    const zone = racine.querySelector('#avant-apres');
    zone.innerHTML = avantApres(releves, b.dataset.cote);
    chargerMedias(zone);
  }));
  chargerMedias(racine);
  brancherRetours(racine);
  racine.querySelectorAll('[data-video-bilan]').forEach((b) => b.addEventListener('click', async () => {
    const url = await api.mediaUrl(b.dataset.videoBilan);
    fenetre('Ma vidéo', url ? `<video src="${esc(url)}" controls playsinline class="lecteur"></video>` : '<p class="vide">Vidéo indisponible (démo).</p>');
  }));
  if (releves.some((r) => retourEstNouveau(r, profil.id))) {
    marquerRetoursVus(profil.id);
    document.dispatchEvent(new CustomEvent('messages-lus'));
  }
  await blocCharges(racine.querySelector('#charges'), profil.id, true);
}

// ───────────── Fiche coach d'une abonnée : poids et ajustement ─────────────
export async function blocSuiviAbonnee(zone, e) {
  const [pesees, ajustements, pa, reglages, releves] = await Promise.all([api.listPesees(e.id), api.listAjustements(e.id), api.getProfilApp(e.id), api.getNutritionApp(), api.listReleves(e.id)]);
  if (!pa?.complete_le) { zone.innerHTML = ''; return; }
  const palier = Number(reglages.coefficients?.palier_glucides_g ?? 30), maxi = Number(reglages.coefficients?.ajustement_max_g ?? 150);
  const vitesse = vitesseRecente(pesees);
  const actuel = pa.ajustement_glucides || 0;
  const valeurs = [];
  for (let v = -maxi; v <= maxi; v += palier || 30) valeurs.push(v);
  if (!valeurs.includes(actuel)) valeurs.push(actuel);
  valeurs.sort((a, b) => a - b);
  zone.innerHTML = `<section class="carte large">
    <div class="surtitre-carte">POIDS ET AJUSTEMENT DU PLAN ALIMENTAIRE</div>
    ${courbe(pesees.map((p) => ({ valeur: p.poids, date: p.date })), { vide: 'Pas encore assez de pesées.' })}
    <p class="petit">${pesees.length} pesée${pesees.length > 1 ? 's' : ''}${pesees.length ? ` · dernière le ${dateCourte(pesees[pesees.length - 1].date)} : ${nombre(pesees[pesees.length - 1].poids)} kg` : ''}
      ${vitesse !== null ? ` · rythme : <strong>${signe(vitesse, 2)} kg / semaine</strong>` : ''}</p>
    <p class="texte">Ajustement en cours : <strong>${esc(texteAjustement(actuel))}</strong></p>
    ${ajustements.length ? `<ul class="liste-ajustements">${[...ajustements].reverse().map((a) => `<li><span>${dateCourte(a.date)}</span>
      <strong>${signe(a.delta, 0)} g</strong><span class="petit">${esc(a.raison || '')}${a.par_coach ? ' (toi)' : ''}${a.vitesse !== null && a.vitesse !== undefined ? ` · ${signe(Number(a.vitesse), 2)} kg / sem.` : ''}</span></li>`).join('')}</ul>` : ''}
    <form class="ligne-pesee" id="form-ajustement">
      <select name="total" aria-label="Ajustement des glucides">${valeurs.map((v) => `<option value="${v}"${v === actuel ? ' selected' : ''}>${esc(texteAjustement(v))}</option>`).join('')}</select>
      <button class="bouton-contour compact" type="submit">Appliquer</button>
    </form>
    <p class="petit">L'ajustement automatique continue ensuite à partir de la valeur que tu choisis.</p>
  </section>
  <section class="carte large">
    <div class="surtitre-carte">RELEVÉS DU MOIS (${releves.length})</div>
    ${releves.length ? `${grilleMesures(releves)}
      <div class="tableau-releves"><div class="ligne-releve tete"><span>Date</span>${MESURES.map(([, n]) => `<span>${n}</span>`).join('')}</div>
      ${[...releves].reverse().map((r) => `<div class="ligne-releve"><span>${dateCourte(r.date)}</span>${MESURES.map(([c]) => `<span>${r[c] != null ? nombre(r[c]) : '—'}</span>`).join('')}</div>`).join('')}</div>
      ${COTES.map(([cle, nom]) => releves.some((r) => r[`photo_${cle}`]) ? `<div class="petit">${nom}</div>${avantApres(releves, cle)}` : '').join('')}`
    : '<p class="petit">Pas encore de relevé.</p>'}
  </section>`;
  chargerMedias(zone);
  zone.querySelector('#form-ajustement').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const total = Number(new FormData(ev.target).get('total'));
    if (total === actuel) return;
    await pendant(ev.submitter, 'Enregistrement…', () => api.ajusterGlucidesCoach(e.id, total));
    toast('Ajustement enregistré : son plan alimentaire est recalculé.');
    blocSuiviAbonnee(zone, e);
  });
}

// ───────────── Espace coach : bilans du mois des abonnées App ─────────────
let filtreBilansApp = 'a_repondre';
export async function bilansApp(racine, profil) {
  const tous = await api.listBilansApp();
  const aRepondre = tous.filter((b) => !b.retour_le);
  const visibles = filtreBilansApp === 'a_repondre' ? aRepondre : tous;
  const carte = (b) => `<article class="carte bilan-app${b.retour_le ? '' : ' a-repondre'}" data-bilan="${esc(b.id)}">
    <div class="ligne-entre"><div><div class="surtitre-carte">${esc((b.prenom || '').toUpperCase())} · BILAN DU ${esc(dateCourte(b.date).toUpperCase())}</div></div>
      <a href="#/coach/eleve/${esc(b.eleve_id)}" class="petit">Voir sa fiche</a></div>
    <div class="grille-mesures">${MESURES.filter(([c]) => b[c] != null).map(([c, n]) => `<div class="mesure-app"><span class="petit">${n}</span><strong>${nombre(b[c])} cm</strong></div>`).join('') || '<p class="petit">Pas de mensurations.</p>'}</div>
    ${COTES.some(([c]) => b[`photo_${c}`]) ? `<div class="grille-3">${COTES.filter(([c]) => b[`photo_${c}`]).map(([c, n]) => `<figure class="photo"><div class="photo-cadre" data-media="${esc(b[`photo_${c}`])}">Photo</div><figcaption>${n}</figcaption></figure>`).join('')}</div>` : ''}
    ${b.ressenti ? `<p class="texte"><strong>Son mois :</strong> ${esc(b.ressenti)}</p>` : ''}
    ${b.question || b.video_chemin ? `<div class="question-bilan"><strong>Sa question${b.video_exercice ? ` · ${esc(b.video_exercice)}` : ''}</strong>
      ${b.question ? `<p class="texte">${esc(b.question)}</p>` : ''}
      ${b.video_chemin ? `<button type="button" class="bouton-contour compact" data-video-bilan="${esc(b.video_chemin)}">${icone('lecture', 16)}Voir sa vidéo</button>` : ''}</div>` : ''}
    ${b.retour_le ? retourBilanHtml(b, { pourCoach: true }) : `<form class="formulaire reponse-bilan-app">
      <label>Ta réponse<textarea name="texte" rows="4" placeholder="Ton retour sur son mois, ses mensurations, ses photos et sa vidéo…"></textarea></label>
      <div class="zone-vocal"></div>
      <button class="bouton-principal compact" type="submit">${icone('envoi', 16)}ENVOYER MA RÉPONSE</button>
    </form>`}
  </article>`;
  racine.innerHTML = pageCoach(profil, 'coach/bilans-app', `<div class="bureau-tete"><div><div class="surtitre">ABONNÉES BOOTY FLOW APP</div><h1>Bilans du mois</h1></div></div>
    <div class="filtres"><button class="filtre${filtreBilansApp === 'a_repondre' ? ' actif' : ''}" data-filtre="a_repondre">À répondre · ${aRepondre.length}</button>
      <button class="filtre${filtreBilansApp === 'tous' ? ' actif' : ''}" data-filtre="tous">Tous · ${tous.length}</button></div>
    <div class="pile">${visibles.map(carte).join('') || '<p class="vide">Aucun bilan à répondre. Bravo !</p>'}</div>`);
  racine.querySelectorAll('[data-filtre]').forEach((x) => x.addEventListener('click', () => { filtreBilansApp = x.dataset.filtre; bilansApp(racine, profil); }));
  racine.querySelectorAll('[data-video-bilan]').forEach((x) => x.addEventListener('click', async () => {
    const url = await api.mediaUrl(x.dataset.videoBilan);
    fenetre('Sa vidéo', url ? `<video src="${esc(url)}" controls playsinline class="lecteur"></video>` : '<p class="vide">Vidéo indisponible (démo).</p>');
  }));
  racine.querySelectorAll('.reponse-bilan-app').forEach((form) => {
    const art = form.closest('[data-bilan]');
    const b = tous.find((x) => x.id === art.dataset.bilan);
    const vocal = enregistreurVocal(form.querySelector('.zone-vocal'));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const texte = new FormData(form).get('texte').trim();
      if (!texte && !vocal.fichier()) { toast('Écris une réponse ou enregistre un vocal.', true); return; }
      await pendant(e.submitter, 'Envoi…', () => api.repondreBilanApp(b.id, b.eleve_id, { texte, audio: vocal.fichier(), duree: vocal.duree() }));
      toast(`Réponse envoyée à ${b.prenom || 'ton abonnée'}.`);
      document.dispatchEvent(new CustomEvent('messages-lus'));
      bilansApp(racine, profil);
    });
  });
  chargerMedias(racine);
  brancherRetours(racine);
}
