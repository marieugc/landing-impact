// BOOTY FLOW APP — pesée de la semaine, courbe de poids et ajustement automatique du plan alimentaire.
import { api } from './data.js';
import { esc, icone, toast, pendant, dateCourte, nombre, courbe, joursAvant } from './ui.js';
import { page, entete, blocCharges } from './eleve.js';
import { encartCoaching } from './formules.js';

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

export async function progresAbonnee(racine, profil) {
  const [pesees, ajustements, reglages] = await Promise.all([api.listPesees(profil.id), api.listAjustements(profil.id), api.getNutritionApp()]);
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
  await blocCharges(racine.querySelector('#charges'), profil.id, true);
}

// ───────────── Fiche coach d'une abonnée : poids et ajustement ─────────────
export async function blocSuiviAbonnee(zone, e) {
  const [pesees, ajustements, pa, reglages] = await Promise.all([api.listPesees(e.id), api.listAjustements(e.id), api.getProfilApp(e.id), api.getNutritionApp()]);
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
  </section>`;
  zone.querySelector('#form-ajustement').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const total = Number(new FormData(ev.target).get('total'));
    if (total === actuel) return;
    await pendant(ev.submitter, 'Enregistrement…', () => api.ajusterGlucidesCoach(e.id, total));
    toast('Ajustement enregistré : son plan alimentaire est recalculé.');
    blocSuiviAbonnee(zone, e);
  });
}
