// BOOTY FLOW APP — page Nutrition de l'abonnée (besoins + journées types) et réglages de la coach.
import { api } from './data.js';
import { esc, icone, toast, pendant, nombre } from './ui.js';
import { page as pageEleve, entete } from './eleve.js';
import { page as pageCoach } from './coach.js';
import { encartCoaching } from './formules.js';
import { besoins, journeeType, libelleQuantite, REGLAGES_DEFAUT } from './nutrition-calcul.js';

const OBJECTIFS = { perte_de_gras: 'Perte de gras', prise_de_muscle: 'Prise de muscle' };
const TYPES = { training: 'Jour training', off: 'Jour off' };

// Profil utilisé pour le calcul : réponses au questionnaire (le poids le plus récent est pris quand il existe)
export function profilCalcul(pa, poidsRecent) {
  return pa ? { poids: poidsRecent ?? pa.poids_depart, taille: pa.taille, age: pa.age, seances_semaine: pa.seances_semaine, objectif: pa.objectif } : null;
}

const chiffre = (v) => nombre(v, 0);
function tuileMacros(b, titre, actif) {
  return `<div class="tuile-jour${actif ? ' actif' : ''}">
    <div class="surtitre-carte">${titre}</div>
    <div class="gros-chiffre">${chiffre(b.kcal)} <small>kcal</small></div>
    <div class="ligne-macros"><span><b>${chiffre(b.proteines)} g</b> protéines</span><span><b>${chiffre(b.glucides)} g</b> glucides</span><span><b>${chiffre(b.lipides)} g</b> lipides</span></div>
  </div>`;
}

function htmlJournee(j) {
  return `<div class="liste-repas-app">${j.repas.map((r) => `
    <section class="repas-app">
      <div class="ligne-entre"><strong>${esc(r.nom)}</strong><span class="petit">${esc(r.heure || '')}</span></div>
      <ul>${r.items.map((it) => `<li>${esc(libelleQuantite(it))}</li>`).join('')}</ul>
      <p class="petit">${chiffre(r.total.kcal)} kcal · P ${chiffre(r.total.proteines)} g · G ${chiffre(r.total.glucides)} g · L ${chiffre(r.total.lipides)} g</p>
    </section>`).join('')}</div>`;
}

// ───────────── Page Nutrition de l'abonnée ─────────────
let typeAffiche = 'training';
export async function nutritionAbonnee(racine, profil) {
  const reglages = await api.getNutritionApp();
  const b = besoins(profilCalcul(profil.app), reglages.coefficients);
  if (!b) {
    racine.innerHTML = pageEleve(profil, 'nutrition', entete('MA NUTRITION', 'Mes besoins') + `<section class="carte">
      <p class="texte">Complète tes informations (âge, taille, poids) pour calculer tes besoins.</p>
      <a href="#/questionnaire" class="bouton-contour compact">Compléter mes informations</a></section>` + encartCoaching('plan_perso'));
    return;
  }
  const j = journeeType(b[typeAffiche], reglages.journees?.[typeAffiche] || [], reglages.aliments || []);
  const pa = profil.app;
  racine.innerHTML = pageEleve(profil, 'nutrition', entete('MA NUTRITION', 'Mes besoins') + `
    <section class="carte">
      <div class="ligne-entre"><div class="surtitre-carte">OBJECTIF : ${esc((OBJECTIFS[pa.objectif] || '').toUpperCase())}</div>
        <a href="#/questionnaire" class="petit">Modifier</a></div>
      <p class="petit">Calculé pour ${nombre(profilCalcul(pa).poids)} kg, ${nombre(pa.taille, 0)} cm, ${pa.age} ans et ${pa.seances_semaine} séances par semaine.
        Moyenne de la semaine : <strong>${chiffre(b.moyenne)} kcal</strong> par jour.</p>
      <div class="grille-2 tuiles-jours">
        <button class="sans-style" data-type="training">${tuileMacros(b.training, 'JOUR TRAINING', typeAffiche === 'training')}</button>
        <button class="sans-style" data-type="off">${tuileMacros(b.off, 'JOUR OFF', typeAffiche === 'off')}</button>
      </div>
    </section>
    <nav class="segments" aria-label="Journée type">
      ${Object.entries(TYPES).map(([t, nom]) => `<button class="segment${t === typeAffiche ? ' actif' : ''}" data-type="${t}">${nom}</button>`).join('')}
    </nav>
    <section class="carte">
      <div class="surtitre-carte">MA JOURNÉE TYPE · ${TYPES[typeAffiche].toUpperCase()}</div>
      ${j.repas.length ? htmlJournee(j) : '<p class="vide">Ta coach prépare tes journées types.</p>'}
      ${j.repas.length ? `<p class="total-journee">Total : <strong>${chiffre(j.total.kcal)} kcal</strong> · P ${chiffre(j.total.proteines)} g · G ${chiffre(j.total.glucides)} g · L ${chiffre(j.total.lipides)} g</p>` : ''}
      <p class="petit">Riz, pâtes et pommes de terre : poids <strong>cuit</strong>. Viandes et poissons : poids <strong>cru</strong>.
        Tu peux remplacer un aliment par un autre de la même famille (poulet ↔ dinde, riz ↔ pâtes).</p>
    </section>
    ${encartCoaching('plan_perso')}`);
  racine.querySelectorAll('[data-type]').forEach((x) => x.addEventListener('click', () => {
    typeAffiche = x.dataset.type;
    nutritionAbonnee(racine, profil);
  }));
}

// ───────────── Réglages de la coach ─────────────
const COEFFICIENTS = [
  ['DÉPENSE DE BASE ET ACTIVITÉ', [
    ['mifflin_constante', 'Constante de la formule (femme : −161)', 'kcal', '1'],
    ['activite_3_seances', 'Multiplicateur d\'activité · 3 séances', '×', '0.01'],
    ['activite_4_seances', 'Multiplicateur d\'activité · 4 séances', '×', '0.01']]],
  ['OBJECTIF', [
    ['deficit_perte_de_gras', 'Déficit pour la perte de gras', 'kcal', '10'],
    ['surplus_prise_de_muscle', 'Surplus pour la prise de muscle', 'kcal', '10']]],
  ['MACROS', [
    ['proteines_g_kg', 'Protéines', 'g/kg', '0.1'],
    ['lipides_g_kg', 'Lipides', 'g/kg', '0.1'],
    ['bonus_jour_training_kcal', 'Supplément des jours training (en glucides)', 'kcal', '10']]],
  ['GARDE-FOUS', [
    ['kcal_minimum', 'Calories minimum par jour', 'kcal', '10'],
    ['glucides_minimum_g', 'Glucides minimum par jour', 'g', '5']]]
];
const ONGLETS = [['calcul', 'Calcul des besoins'], ['journees', 'Journées types'], ['aliments', 'Aliments']];
const exemple = { poids: 62, taille: 165, age: 29, seances_semaine: 4, objectif: 'perte_de_gras' };

export async function reglagesNutrition(racine, profil, [onglet = 'calcul'] = []) {
  const reglages = await api.getNutritionApp();
  const tete = `<div class="bureau-tete"><div><div class="surtitre">ABONNÉES BOOTY FLOW APP</div><h1>Nutrition App</h1></div></div>
    <div class="filtres">${ONGLETS.map(([cle, nom]) => `<a href="#/coach/nutrition-app/${cle}" class="filtre${cle === onglet ? ' actif' : ''}">${nom}</a>`).join('')}</div>`;
  racine.innerHTML = pageCoach(profil, 'coach/nutrition-app', tete + '<div id="zone-nutrition"></div>');
  const zone = racine.querySelector('#zone-nutrition');
  const recharger = () => reglagesNutrition(racine, profil, [onglet]);
  await ({ calcul: ongletCalcul, journees: ongletJournees, aliments: ongletAliments }[onglet] || ongletCalcul)(zone, reglages, recharger);
}

// Exemple de profil modifiable, pour voir l'effet des réglages
function champsExemple() {
  return `<div class="grille-exemple">
    <label>Poids<input data-ex="poids" type="number" step="0.5" value="${exemple.poids}"></label>
    <label>Taille<input data-ex="taille" type="number" value="${exemple.taille}"></label>
    <label>Âge<input data-ex="age" type="number" value="${exemple.age}"></label>
    <label>Séances<select data-ex="seances_semaine">${[3, 4].map((n) => `<option${n === exemple.seances_semaine ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
    <label>Objectif<select data-ex="objectif">${Object.entries(OBJECTIFS).map(([v, t]) => `<option value="${v}"${v === exemple.objectif ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
  </div>`;
}
function brancherExemple(zone, dessiner) {
  zone.querySelectorAll('[data-ex]').forEach((x) => x.addEventListener('input', () => {
    exemple[x.dataset.ex] = x.tagName === 'SELECT' && x.dataset.ex === 'objectif' ? x.value : Number(x.value);
    dessiner();
  }));
}

async function ongletCalcul(zone, reglages, recharger) {
  const c = { ...REGLAGES_DEFAUT.coefficients, ...reglages.coefficients };
  zone.innerHTML = `<div class="deux-colonnes">
    <form class="formulaire carte" id="form-coefficients">
      ${COEFFICIENTS.map(([titre, champs]) => `<fieldset class="bloc-formule"><legend class="surtitre-carte">${titre}</legend>
        ${champs.map(([cle, libelle, unite, pas]) => `<label>${libelle}<span class="avec-unite"><input name="${cle}" type="number" step="${pas}" value="${esc(c[cle])}" required><em>${unite}</em></span></label>`).join('')}
      </fieldset>`).join('')}
      <p class="petit">Dépense = (10 × poids + 6,25 × taille − 5 × âge + constante) × multiplicateur d'activité. Puis − déficit ou + surplus.
        Protéines et lipides en g/kg, les glucides complètent. Les jours training reçoivent le supplément, les jours off sont baissés pour garder la même moyenne sur la semaine.</p>
      <button class="bouton-principal" type="submit">ENREGISTRER</button>
    </form>
    <section class="carte" id="apercu-calcul"></section>
  </div>`;
  const form = zone.querySelector('#form-coefficients');
  const lire = () => Object.fromEntries(COEFFICIENTS.flatMap(([, ch]) => ch).map(([cle]) => [cle, Number(form.elements[cle].value)]));
  const dessiner = () => {
    const b = besoins(exemple, lire());
    zone.querySelector('#apercu-calcul').innerHTML = `<div class="surtitre-carte">EXEMPLE (MODIFIABLE)</div>${champsExemple()}
      ${b ? `<p class="petit">Dépense de base ${chiffre(b.base)} kcal · dépense ${chiffre(b.depense)} kcal · moyenne visée <strong>${chiffre(b.moyenne)} kcal</strong></p>
      ${tuileMacros(b.training, 'JOUR TRAINING')}${tuileMacros(b.off, 'JOUR OFF')}` : ''}`;
    brancherExemple(zone.querySelector('#apercu-calcul'), dessiner);
  };
  form.addEventListener('input', dessiner);
  dessiner();
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await pendant(e.submitter, 'Enregistrement…', () => api.saveNutritionApp({ coefficients: { ...c, ...lire() } }));
    toast('Réglages enregistrés : les besoins de tes abonnées sont recalculés.');
  });
}

// ── Journées types : repas, part de la journée, aliments et rôle ──
const ROLES = { proteine: 'Protéines (calculé)', glucide: 'Glucides (calculé)', lipide: 'Lipides (calculé)', fixe: 'Quantité fixe' };
let typeJournee = 'training';

function htmlRepas(r, i, aliments) {
  return `<fieldset class="carte-exercice repas-modele" data-repas="${i}">
    <div class="ligne-entre"><legend class="surtitre-carte">REPAS ${i + 1}</legend>
      <button type="button" class="bouton-rond" data-retirer-repas="${i}" aria-label="Supprimer le repas">${icone('poubelle', 16)}</button></div>
    <div class="grille-3">
      <label>Nom<input data-r="nom" value="${esc(r.nom)}" required></label>
      <label>Heure<input data-r="heure" value="${esc(r.heure || '')}"></label>
      <label>Part de la journée<span class="avec-unite"><input data-r="part" type="number" min="0" max="100" value="${esc(r.part)}"><em>%</em></span></label>
    </div>
    ${(r.aliments || []).map((x, k) => `<div class="ligne-aliment" data-aliment="${k}">
      <select data-a="aliment" aria-label="Aliment">${aliments.map((a) => `<option value="${esc(a.id)}"${a.id === x.aliment ? ' selected' : ''}>${esc(a.nom)}${a.etat ? ` (${a.etat})` : ''}</option>`).join('')}</select>
      <select data-a="role" aria-label="Rôle">${Object.entries(ROLES).map(([v, t]) => `<option value="${v}"${v === x.role ? ' selected' : ''}>${t}</option>`).join('')}</select>
      <input data-a="quantite" type="number" min="0" value="${esc(x.quantite ?? '')}" placeholder="Qté fixe" aria-label="Quantité fixe"${x.role === 'fixe' ? '' : ' disabled'}>
      <button type="button" class="bouton-rond" data-retirer-aliment="${i}:${k}" aria-label="Retirer">${icone('croix', 14)}</button>
    </div>`).join('')}
    <button type="button" class="lien" data-ajouter-aliment="${i}">+ Ajouter un aliment</button>
  </fieldset>`;
}
function lireRepas(zone) {
  return [...zone.querySelectorAll('.repas-modele')].map((f) => ({
    nom: f.querySelector('[data-r="nom"]').value.trim(), heure: f.querySelector('[data-r="heure"]').value.trim(),
    part: Number(f.querySelector('[data-r="part"]').value) || 0,
    aliments: [...f.querySelectorAll('.ligne-aliment')].map((l) => {
      const role = l.querySelector('[data-a="role"]').value;
      return { aliment: l.querySelector('[data-a="aliment"]').value, role, ...(role === 'fixe' ? { quantite: Number(l.querySelector('[data-a="quantite"]').value) || 0 } : {}) };
    })
  }));
}

async function ongletJournees(zone, reglages) {
  const aliments = reglages.aliments || [];
  let repas = structuredClone(reglages.journees?.[typeJournee] || []);
  const dessiner = () => {
    const parts = repas.reduce((t, r) => t + (Number(r.part) || 0), 0);
    zone.innerHTML = `<nav class="segments court" aria-label="Type de journée">${Object.entries(TYPES).map(([t, nom]) =>
      `<button class="segment${t === typeJournee ? ' actif' : ''}" data-type-journee="${t}">${nom}</button>`).join('')}</nav>
      <div class="deux-colonnes">
        <form class="formulaire" id="form-journee">
          <p class="petit">Pour chaque repas : sa part de la journée, puis ses aliments. Les sources de protéines, glucides et lipides
            sont calculées pour chaque abonnée, puis arrondies (chiffres ronds). Les aliments « Quantité fixe » gardent la quantité indiquée.</p>
          ${repas.map((r, i) => htmlRepas(r, i, aliments)).join('')}
          <p class="petit">Total des parts : <strong class="${parts === 100 ? '' : 'alerte'}">${parts} %</strong>${parts === 100 ? '' : ' (idéalement 100 %)'}</p>
          <button type="button" class="bouton-contour" id="ajouter-repas">${icone('plus', 18)}Ajouter un repas</button>
          <div class="barre-enregistrer"><button class="bouton-principal" type="submit">ENREGISTRER LA JOURNÉE ${TYPES[typeJournee].toUpperCase()}</button></div>
        </form>
        <section class="carte" id="apercu-journee"></section>
      </div>`;
    const form = zone.querySelector('#form-journee');
    const garder = () => { repas = lireRepas(form); };
    const apercu = () => {
      const b = besoins(exemple, reglages.coefficients);
      const j = b ? journeeType(b[typeJournee], lireRepas(form), aliments) : null;
      zone.querySelector('#apercu-journee').innerHTML = `<div class="surtitre-carte">APERÇU POUR L'EXEMPLE</div>${champsExemple()}
        ${j ? `<p class="petit">Cible : ${chiffre(b[typeJournee].kcal)} kcal · P ${b[typeJournee].proteines} · G ${b[typeJournee].glucides} · L ${b[typeJournee].lipides}</p>
        ${htmlJournee(j)}<p class="total-journee">Total : <strong>${chiffre(j.total.kcal)} kcal</strong> · P ${j.total.proteines} · G ${j.total.glucides} · L ${j.total.lipides}</p>` : ''}`;
      brancherExemple(zone.querySelector('#apercu-journee'), apercu);
    };
    apercu();
    form.addEventListener('input', apercu);
    form.addEventListener('change', (e) => {
      if (e.target.matches('[data-a="role"]')) { garder(); dessiner(); }
    });
    zone.querySelectorAll('[data-type-journee]').forEach((b) => b.addEventListener('click', () => {
      typeJournee = b.dataset.typeJournee;
      repas = structuredClone(reglages.journees?.[typeJournee] || []);
      dessiner();
    }));
    form.querySelector('#ajouter-repas').addEventListener('click', () => {
      garder(); repas.push({ nom: 'Nouveau repas', heure: '', part: 0, aliments: [] }); dessiner();
    });
    form.querySelectorAll('[data-retirer-repas]').forEach((b) => b.addEventListener('click', () => {
      garder(); repas.splice(Number(b.dataset.retirerRepas), 1); dessiner();
    }));
    form.querySelectorAll('[data-ajouter-aliment]').forEach((b) => b.addEventListener('click', () => {
      garder(); repas[Number(b.dataset.ajouterAliment)].aliments.push({ aliment: aliments[0]?.id, role: 'proteine' }); dessiner();
    }));
    form.querySelectorAll('[data-retirer-aliment]').forEach((b) => b.addEventListener('click', () => {
      garder();
      const [i, k] = b.dataset.retirerAliment.split(':').map(Number);
      repas[i].aliments.splice(k, 1); dessiner();
    }));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      garder();
      const journees = { ...reglages.journees, [typeJournee]: repas };
      await pendant(e.submitter, 'Enregistrement…', () => api.saveNutritionApp({ journees }));
      reglages.journees = journees;
      toast(`Journée ${TYPES[typeJournee].toLowerCase()} enregistrée.`);
    });
  };
  dessiner();
}

// ── Aliments : valeurs pour 100 g, état (cru / cuit), arrondi ──
const CATEGORIES_ALIMENTS = { proteine: 'Protéines', glucide: 'Glucides', lipide: 'Lipides', legume: 'Légumes', fruit: 'Fruits', autre: 'Autre' };
async function ongletAliments(zone, reglages, recharger) {
  let aliments = structuredClone(reglages.aliments || []);
  const ligne = (a, i) => `<div class="ligne-aliment-table" data-i="${i}">
    <input data-k="nom" value="${esc(a.nom)}" aria-label="Nom" required>
    <select data-k="etat" aria-label="Poids">${[['', '—'], ['cru', 'cru'], ['cuit', 'cuit']].map(([v, t]) => `<option value="${v}"${(a.etat || '') === v ? ' selected' : ''}>${t}</option>`).join('')}</select>
    <select data-k="categorie" aria-label="Famille">${Object.entries(CATEGORIES_ALIMENTS).map(([v, t]) => `<option value="${v}"${a.categorie === v ? ' selected' : ''}>${t}</option>`).join('')}</select>
    ${['kcal', 'proteines', 'glucides', 'lipides'].map((k) => `<input data-k="${k}" type="number" step="0.1" min="0" value="${esc(a[k])}" aria-label="${k}">`).join('')}
    <input data-k="pas" type="number" min="1" value="${esc(a.pas || 50)}" aria-label="Arrondi">
    <input data-k="unite" value="${esc(a.unite && a.unite !== 'g' ? a.unite : '')}" placeholder="g" aria-label="Unité">
    <input data-k="poids_unite" type="number" min="0" value="${esc(a.poids_unite || '')}" placeholder="—" aria-label="Poids d'une unité">
    <button type="button" class="bouton-rond" data-supprimer="${i}" aria-label="Supprimer ${esc(a.nom)}">${icone('poubelle', 16)}</button>
  </div>`;
  const dessiner = () => {
    zone.innerHTML = `<form class="formulaire carte" id="form-aliments">
      <p class="petit">Valeurs pour 100 g. « Poids » : cru pour les viandes et poissons, cuit pour le riz, les pâtes et les pommes de terre (affiché à l'abonnée).
        « Arrondi » : les quantités sont des multiples de ce nombre (50 → 100, 150, 200 g). Pour un aliment compté à l'unité (œuf, banane),
        indique l'unité, son poids, et un arrondi de 1.</p>
      <div class="tableau-aliments">
        <div class="ligne-aliment-table tete"><span>Aliment</span><span>Poids</span><span>Famille</span><span>kcal</span><span>Prot.</span><span>Gluc.</span><span>Lip.</span><span>Arrondi</span><span>Unité</span><span>g / unité</span><span></span></div>
        ${aliments.map(ligne).join('')}
      </div>
      <button type="button" class="bouton-contour" id="ajouter-aliment">${icone('plus', 18)}Ajouter un aliment</button>
      <div class="barre-enregistrer"><button class="bouton-principal" type="submit">ENREGISTRER LES ALIMENTS</button></div>
    </form>`;
    const form = zone.querySelector('form');
    const lire = () => [...form.querySelectorAll('.ligne-aliment-table[data-i]')].map((l) => {
      const a = aliments[Number(l.dataset.i)];
      const v = (k) => l.querySelector(`[data-k="${k}"]`).value.trim();
      const unite = v('unite');
      return { ...a, nom: v('nom'), etat: v('etat'), categorie: v('categorie'),
        kcal: Number(v('kcal')) || 0, proteines: Number(v('proteines')) || 0, glucides: Number(v('glucides')) || 0, lipides: Number(v('lipides')) || 0,
        pas: Number(v('pas')) || 50, ...(unite ? { unite, poids_unite: Number(v('poids_unite')) || 100 } : { unite: undefined, poids_unite: undefined }) };
    });
    form.querySelector('#ajouter-aliment').addEventListener('click', () => {
      aliments = lire();
      aliments.push({ id: `al-${Date.now().toString(36)}`, nom: 'Nouvel aliment', etat: '', categorie: 'autre', kcal: 0, proteines: 0, glucides: 0, lipides: 0, pas: 50 });
      dessiner();
    });
    form.querySelectorAll('[data-supprimer]').forEach((b) => b.addEventListener('click', () => {
      const a = aliments[Number(b.dataset.supprimer)];
      const utilise = Object.values(reglages.journees || {}).flat().some((r) => (r.aliments || []).some((x) => x.aliment === a.id));
      if (utilise) { toast(`« ${a.nom} » est utilisé dans une journée type : retire-le d'abord de la journée.`, true); return; }
      aliments = lire(); aliments.splice(Number(b.dataset.supprimer), 1); dessiner();
    }));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      aliments = lire();
      await pendant(e.submitter, 'Enregistrement…', () => api.saveNutritionApp({ aliments }));
      reglages.aliments = aliments;
      toast('Aliments enregistrés.');
    });
  };
  dessiner();
}
