// BOOTY FLOW APP — questionnaire de première connexion et programme (séance du jour, séances cochées, cycles).
import { api } from './data.js';
import { esc, icone, toast, pendant, badge, dateCourte } from './ui.js';
import { page, entete } from './eleve.js';
import { ouvrirVideo } from './videotheque.js';

export const NIVEAUX = { intermediaire: 'Intermédiaire', avancee: 'Avancée' };
export const LIEUX = { salle: 'En salle', maison: 'À la maison' };
export const OBJECTIFS = { perte_de_gras: 'Perte de gras', prise_de_muscle: 'Prise de muscle' };

// ───────────── Questionnaire ─────────────
const choix = (nom, options, valeur) => `<div class="choix-pastilles" role="radiogroup">${Object.entries(options).map(([v, t]) => {
  const [titre, detail] = Array.isArray(t) ? t : [t, ''];
  return `<label class="pastille-choix"><input type="radio" name="${nom}" value="${v}" required${String(valeur) === v ? ' checked' : ''}>
    <span><strong>${esc(titre)}</strong>${detail ? `<small>${esc(detail)}</small>` : ''}</span></label>`;
}).join('')}</div>`;

export async function questionnaire(racine, profil, { modification = false } = {}) {
  const r = profil.app || {};
  const nombreChamp = (nom, libelle, unite, min, max, valeur, pas = '1') => `<label>${libelle}
    <span class="avec-unite"><input name="${nom}" type="number" inputmode="decimal" min="${min}" max="${max}" step="${pas}" value="${esc(valeur ?? '')}" required><em>${unite}</em></span></label>`;
  racine.innerHTML = page(profil, 'programme', `
    ${modification ? `<header class="entete"><a href="#/compte" class="bouton-rond" aria-label="Retour">${icone('retour', 20)}</a>
      <div><div class="surtitre">MON PROFIL</div><h1>Mes informations</h1></div></header>`
    : `<img src="img/banniere.jpg" alt="Booty Flow" class="banniere">
      <div class="bonjour">Bienvenue ${esc(profil.prenom || '')} !</div>
      <p class="texte">Quelques questions pour te donner le bon programme et calculer tes besoins. Ça prend 1 minute.</p>`}
    <form class="formulaire" id="form-questionnaire">
      <section class="carte"><div class="surtitre-carte">TOI</div>
        <label>Prénom<input name="prenom" value="${esc(profil.prenom || '')}" autocomplete="given-name" required maxlength="60"></label>
        <div class="grille-3">
          ${nombreChamp('age', 'Âge', 'ans', 14, 99, r.age)}
          ${nombreChamp('taille', 'Taille', 'cm', 120, 220, r.taille)}
          ${nombreChamp('poids', 'Poids', 'kg', 30, 250, r.poids_depart, '0.1')}
        </div>
      </section>
      <section class="carte"><div class="surtitre-carte">TON NIVEAU</div>
        ${choix('niveau', { intermediaire: ['Intermédiaire', 'Tu t\'entraînes régulièrement depuis plusieurs mois'], avancee: ['Avancée', 'Tu maîtrises les mouvements et tu charges lourd'] }, r.niveau)}
      </section>
      <section class="carte"><div class="surtitre-carte">SÉANCES PAR SEMAINE</div>
        ${choix('seances_semaine', { 3: ['3 séances', ''], 4: ['4 séances', ''] }, r.seances_semaine)}
      </section>
      <section class="carte"><div class="surtitre-carte">OÙ T'ENTRAÎNES-TU ?</div>
        ${choix('lieu', { salle: ['En salle', ''], maison: ['À la maison', 'Variantes avec élastiques, haltères ou sac lesté'] }, r.lieu)}
      </section>
      <section class="carte"><div class="surtitre-carte">TON OBJECTIF</div>
        ${choix('objectif', { perte_de_gras: ['Perte de gras', 'Affiner et dessiner ta silhouette'], prise_de_muscle: ['Prise de muscle', 'Développer tes fessiers et ta masse musculaire'] }, r.objectif)}
      </section>
      ${modification ? '<p class="petit">Si tu changes de niveau ou de nombre de séances, ton programme est remplacé et tu repars au début du cycle 1.</p>' : ''}
      <button class="bouton-principal" type="submit">${modification ? 'ENREGISTRER' : 'DÉCOUVRIR MON PROGRAMME'}</button>
    </form>`);

  racine.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = new FormData(e.target);
    const reponses = {
      prenom: d.get('prenom').trim(), age: Number(d.get('age')), taille: Number(d.get('taille')), poids: Number(d.get('poids')),
      niveau: d.get('niveau'), seances_semaine: Number(d.get('seances_semaine')), lieu: d.get('lieu'), objectif: d.get('objectif')
    };
    profil.app = await pendant(e.submitter, 'Enregistrement…', () => api.terminerQuestionnaire(reponses));
    profil.prenom = reponses.prenom;
    toast(modification ? 'Informations enregistrées.' : 'Ton programme est prêt !');
    if (location.hash === '#/programme') programme(racine, profil);
    else location.hash = '#/programme';
  });
}

// ───────────── Où en est-elle ? ─────────────
const cle = (seanceId, semaine) => `${seanceId}:${semaine}`;

// Semaine en cours = première semaine qui a encore une séance à faire ; séance du jour = première séance non faite de cette semaine
export async function etatProgramme(profil) {
  const pa = profil.app;
  if (!pa?.programme_id) return null;
  const [cycle, faites] = await Promise.all([
    api.getCycleApp(pa.programme_id, pa.cycle_numero || 1),
    api.listSeancesFaites(profil.id, pa.cycle_numero || 1)
  ]);
  if (!cycle) return null;
  const fait = new Map(faites.map((f) => [cle(f.seance_id, f.semaine), f]));
  const seances = cycle.seances;
  let semaine = 13;
  for (let s = 1; s <= 12; s++) {
    if (seances.some((x) => !fait.has(cle(x.id, s)))) { semaine = s; break; }
  }
  const seanceDuJour = semaine <= 12 ? seances.find((x) => !fait.has(cle(x.id, semaine))) : null;
  const total = seances.length * 12;
  return { pa, cycle, seances, fait, semaine, seanceDuJour, total, faites: faites.length, termine: seances.length > 0 && semaine === 13 };
}

// Vidéo de la vidéothèque : celle choisie par la coach, sinon celle dont le titre contient le nom de l'exercice
const normaliser = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
function videoDe(ex, biblio) {
  // Vidéo envoyée par la coach pour cet exercice, sinon son lien, sinon la vidéothèque
  if (ex.video_chemin || ex.video_lien) {
    return { titre: ex.nom, categorie: 'Exercice', description: ex.consignes, chemin: ex.video_chemin || null, lien: ex.video_chemin ? null : ex.video_lien };
  }
  if (ex.video_id) return biblio.find((v) => v.id === ex.video_id) || null;
  const nom = normaliser(ex.nom);
  return nom ? biblio.find((v) => normaliser(v.titre).includes(nom)) || null : null;
}

// ───────────── Écran Programme ─────────────
let vue = { semaine: null, seance: null }; // semaine et séance affichées (null = celles du jour)

export async function programme(racine, profil) {
  if (!profil.app?.programme_id) {
    racine.innerHTML = page(profil, 'programme', entete('MON PROGRAMME', 'Séance du jour') + `<section class="carte">
      <p class="texte">Ta coach prépare le programme qui correspond à tes réponses. Il apparaîtra ici très vite.</p>
      <a href="#/questionnaire" class="bouton-contour compact">Modifier mes réponses</a></section>`);
    return;
  }
  const [etat, biblio] = await Promise.all([etatProgramme(profil), api.listBibliotheque().catch(() => [])]);
  if (!etat || !etat.seances.length) {
    racine.innerHTML = page(profil, 'programme', entete('MON PROGRAMME', 'Séance du jour') + '<section class="carte"><p class="texte">Ce cycle est en cours de préparation par ta coach.</p></section>');
    return;
  }
  const { pa, cycle, seances, fait, semaine: semaineEnCours, seanceDuJour, total, faites, termine } = etat;
  const semaine = Math.min(12, vue.semaine || semaineEnCours);
  const seance = seances.find((s) => s.id === vue.seance) || (semaine === semaineEnCours && seanceDuJour) || seances[0];
  const estDuJour = seance === seanceDuJour && semaine === semaineEnCours;
  const faite = fait.get(cle(seance.id, semaine));
  const future = semaine > semaineEnCours;
  const pct = Math.round((faites / Math.max(1, total)) * 100);
  const consigneSemaine = cycle.semaines?.find((x) => x.numero === semaine)?.consigne;
  const maison = pa.lieu === 'maison';

  const videos = (seance.exercices || []).map((ex) => videoDe(ex, biblio));
  const exercices = (seance.exercices || []).map((ex, i) => {
    const p = ex.progression?.[semaine - 1] || {};
    const video = videos[i];
    return `<li class="exercice">
      <div class="exercice-tete"><span class="numero">${i + 1}</span>
        <div><strong>${esc(maison && ex.alternative_maison ? ex.alternative_maison : ex.nom)}</strong>
          ${maison && ex.alternative_maison ? `<div class="petit">Variante maison de : ${esc(ex.nom)}</div>` : ''}</div>
        ${ex.principal ? badge('PRINCIPAL') : ''}</div>
      <div class="exercice-chiffres">
        <span><b>${esc(p.series || ex.series || '—')}</b> séries</span>
        <span><b>${esc(p.reps || ex.reps || '—')}</b> répétitions</span>
        <span><b>${esc(ex.repos || '—')}</b> de repos</span>
      </div>
      ${p.charge ? `<p class="exercice-charge">${icone('haltere', 16, 'var(--accent)')}<span>${esc(p.charge)}</span></p>` : ''}
      ${ex.consignes ? `<p class="petit">${esc(ex.consignes)}</p>` : ''}
      ${!maison && ex.alternative_maison ? `<details class="petit"><summary>Variante à la maison</summary>${esc(ex.alternative_maison)}</details>` : ''}
      ${video ? `<button class="bouton-contour compact" data-video="${i}">${icone('lecture', 16)}Voir la vidéo</button>` : ''}
    </li>`;
  }).join('');

  const pastilleSemaine = (s) => {
    const complete = seances.every((x) => fait.has(cle(x.id, s)));
    return `<button class="pastille-semaine${s === semaine ? ' actif' : ''}${complete ? ' faite' : ''}${s === semaineEnCours ? ' en-cours' : ''}" data-semaine="${s}"
      aria-label="Semaine ${s}${complete ? ', terminée' : ''}">${complete ? icone('check', 14) : s}</button>`;
  };
  const ongletSeance = (s) => {
    const ok = fait.has(cle(s.id, semaine));
    return `<button class="segment${s.id === seance.id ? ' actif' : ''}" data-seance="${esc(s.id)}">${ok ? '✓ ' : ''}${esc(s.nom.split('·')[0].trim())}</button>`;
  };

  racine.innerHTML = page(profil, 'programme', entete(`CYCLE ${pa.cycle_numero} · SEMAINE ${Math.min(12, semaineEnCours)} SUR 12`, 'Mon programme') + `
    ${termine ? `<section class="carte carte-bravo">
      <div class="surtitre-carte">CYCLE ${pa.cycle_numero} TERMINÉ</div>
      <div class="titre-carte">Bravo ${esc(profil.prenom || '')}, 12 semaines bouclées !</div>
      <p class="petit">Compare tes charges avec celles du début du cycle dans Progrès, puis passe au cycle suivant.</p>
      <button class="bouton-principal" id="cycle-suivant">DÉBLOQUER LE CYCLE ${pa.cycle_numero + 1}</button>
    </section>` : ''}
    <section class="carte">
      <div class="ligne-entre petit"><span>${esc(cycle.titre || `Cycle ${pa.cycle_numero}`)} · ${faites} séance${faites > 1 ? 's' : ''} sur ${total}</span><strong class="lilas">${pct} %</strong></div>
      <div class="jauge"><div style="width:${pct}%"></div></div>
      <div class="defile-semaines" role="group" aria-label="Semaines du cycle">${Array.from({ length: 12 }, (_, i) => pastilleSemaine(i + 1)).join('')}</div>
      ${consigneSemaine ? `<p class="petit"><strong>Semaine ${semaine} :</strong> ${esc(consigneSemaine)}</p>` : ''}
    </section>
    <nav class="segments" aria-label="Séances de la semaine">${seances.map(ongletSeance).join('')}</nav>
    <section class="carte carte-seance${estDuJour ? ' du-jour' : ''}">
      <div class="ligne-entre"><div class="surtitre-carte">${estDuJour ? 'LA SÉANCE DU JOUR' : `SEMAINE ${semaine}`}</div>
        ${faite ? badge(faite.statut === 'sautee' ? 'PASSÉE' : `FAITE LE ${dateCourte(faite.fait_le).toUpperCase()}`, 'var(--vert)') : ''}</div>
      <h2 class="titre-carte">${esc(seance.nom)}</h2>
      ${seance.description ? `<p class="petit">${esc(seance.description)}</p>` : ''}
      <ol class="liste-exercices">${exercices || '<p class="vide">Aucun exercice pour le moment.</p>'}</ol>
    </section>
    ${future ? '<p class="petit centre">Cette semaine se débloque quand tu as fini les précédentes.</p>'
      : faite ? `<button class="lien" id="annuler">Annuler : je ne l'ai pas faite</button>`
      : `<button class="bouton-principal" id="faite">${icone('check', 18)}J'AI FAIT CETTE SÉANCE</button>`}
    <a href="#/progres" class="bouton-contour">${icone('haltere', 18)}Noter mes charges</a>
    ${!future && semaine === semaineEnCours && !termine && seances.some((x) => !fait.has(cle(x.id, semaine)))
      ? '<button class="lien" id="passer">Je n\'ai pas pu tout faire : passer à la semaine suivante</button>' : ''}
  `);

  const recharger = () => programme(racine, profil);
  racine.querySelectorAll('[data-semaine]').forEach((b) => b.addEventListener('click', () => {
    vue = { semaine: Number(b.dataset.semaine), seance: null };
    recharger();
  }));
  racine.querySelectorAll('[data-seance]').forEach((b) => b.addEventListener('click', () => {
    vue = { semaine, seance: b.dataset.seance };
    recharger();
  }));
  racine.querySelectorAll('[data-video]').forEach((b) => b.addEventListener('click', () =>
    ouvrirVideo(videos[Number(b.dataset.video)])));
  racine.querySelector('#faite')?.addEventListener('click', async (e) => {
    await pendant(e.currentTarget, 'Enregistrement…', () => api.marquerSeances([{ seance_id: seance.id, cycle_numero: pa.cycle_numero, semaine, statut: 'faite' }]));
    toast('Bravo, séance cochée !');
    vue = { semaine: null, seance: null }; // on passe à la séance suivante
    recharger();
  });
  racine.querySelector('#annuler')?.addEventListener('click', async () => {
    await api.annulerSeance({ seance_id: seance.id, cycle_numero: pa.cycle_numero, semaine });
    recharger();
  });
  racine.querySelector('#passer')?.addEventListener('click', async (e) => {
    if (!confirm(`Passer à la semaine ${semaine + 1} ? Les séances non faites de la semaine ${semaine} seront marquées comme passées.`)) return;
    const restantes = seances.filter((x) => !fait.has(cle(x.id, semaine)))
      .map((x) => ({ seance_id: x.id, cycle_numero: pa.cycle_numero, semaine, statut: 'sautee' }));
    await pendant(e.currentTarget, 'Enregistrement…', () => api.marquerSeances(restantes));
    vue = { semaine: null, seance: null };
    recharger();
  });
  racine.querySelector('#cycle-suivant')?.addEventListener('click', async (e) => {
    try {
      const numero = await pendant(e.currentTarget, 'Un instant…', () => api.passerCycleSuivant());
      profil.app = { ...profil.app, cycle_numero: numero };
      vue = { semaine: null, seance: null };
      toast(`Cycle ${numero} débloqué !`);
      recharger();
    } catch (err) { /* message affiché par pendant() */ }
  });
}
