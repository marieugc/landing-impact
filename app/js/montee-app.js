// BOOTY FLOW APP — montée en gamme : message de plateau (Audit) et bilan de fin de cycle.
// Visible uniquement dans l'espace des abonnées App (les élèves coaching n'ont pas accès à ces écrans).
import { api } from './data.js';
import { CALENDLY_URL, NOM_COACH } from './config.js';
import { esc, icone, toast, pendant, nombre, ecart, dateCourte } from './ui.js';
import { page, entete } from './eleve.js';
import { etatProgramme } from './programme-app.js';
import { detecterPlateau, bilanCycle, exercicesPrincipaux } from './montee-calcul.js';

const MESURES = { tour_taille: 'Tour de taille', hanches: 'Hanches', fessiers: 'Fessiers', cuisse: 'Cuisse', bras: 'Bras' };
const lienAudit = (classe = 'bouton-principal') => CALENDLY_URL
  ? `<a href="${esc(CALENDLY_URL)}" class="${classe}" target="_blank" rel="noopener">${icone('horloge', 18)}Réserver mon Audit</a>`
  : '';

// Message de plateau masqué pendant 14 jours si l'abonnée le ferme
const cleMasque = (uid) => `bootyflow-plateau-masque-${uid}`;
const masque = (uid) => { try { return Number(localStorage.getItem(cleMasque(uid)) || 0) > Date.now(); } catch (e) { return false; } };

export async function plateau(profil, etat) {
  if (!etat?.seances?.length || masque(profil.id)) return null;
  const charges = await api.listCharges(profil.id).catch(() => []);
  const r = detecterPlateau(charges, exercicesPrincipaux(etat.seances));
  return r.plateau ? r : null;
}

export function encartPlateau(r) {
  if (!r) return '';
  const noms = r.exercices.map((x) => `${x.exercice} (${nombre(x.recordRecent)} kg)`).join(', ');
  return `<section class="carte encart-montee" id="encart-plateau">
    <div class="ligne-entre"><div class="surtitre-carte">TES CHARGES STAGNENT</div>
      <button class="bouton-rond petit-rond" id="masquer-plateau" aria-label="Masquer ce message">${icone('croix', 14)}</button></div>
    <strong>Tes charges ne montent plus depuis 4 semaines</strong>
    <p class="petit">Sur tes exercices principaux : ${esc(noms)}. Un plateau, ça se débloque : technique, récupération, nutrition, volume…
      Réserve un Audit avec ${esc(NOM_COACH)} pour trouver ce qui te freine.</p>
    ${lienAudit()}
  </section>`;
}
export function brancherPlateau(racine, profil) {
  racine.querySelector('#masquer-plateau')?.addEventListener('click', () => {
    try { localStorage.setItem(cleMasque(profil.id), String(Date.now() + 14 * 864e5)); } catch (e) { /* ignore */ }
    racine.querySelector('#encart-plateau')?.remove();
  });
}

// ───────────── Bilan de fin de cycle ─────────────
export async function bilanDeCycle(racine, profil) {
  const etat = await etatProgramme(profil).catch(() => null);
  if (!etat) { location.replace('#/programme'); return; }
  const [pesees, releves, charges, faites] = await Promise.all([
    api.listPesees(profil.id).catch(() => []), api.listReleves(profil.id).catch(() => []),
    api.listCharges(profil.id).catch(() => []), api.listSeancesFaites(profil.id, etat.pa.cycle_numero)
  ]);
  const debut = etat.pa.debut_cycle || faites.map((f) => String(f.fait_le).slice(0, 10)).sort()[0] || new Date().toISOString().slice(0, 10);
  const b = bilanCycle({ debut, seances: etat.seances, faites, pesees, releves, charges, principaux: exercicesPrincipaux(etat.seances) });
  const perte = etat.pa.objectif !== 'prise_de_muscle';
  const ligne = (nom, valeur, detail = '') => `<div class="ligne-entre ligne-compte"><span>${nom}</span><span><strong>${valeur}</strong>${detail ? ` <small class="petit">${detail}</small>` : ''}</span></div>`;

  racine.innerHTML = page(profil, 'programme', `
    <header class="entete"><a href="#/programme" class="bouton-rond" aria-label="Retour">${icone('retour', 20)}</a>
      <div><div class="surtitre">CYCLE ${etat.pa.cycle_numero}${etat.termine ? ' TERMINÉ' : ' EN COURS'}</div><h1>Bilan de ton cycle</h1></div></header>
    <section class="carte carte-bravo">
      <div class="titre-carte">${etat.termine ? `Bravo ${esc(profil.prenom || '')}, 12 semaines bouclées !` : `Ton cycle en chiffres, ${esc(profil.prenom || '')}`}</div>
      <p class="petit">Depuis le ${dateCourte(debut)} · ${esc(etat.cycle.titre || '')}</p>
    </section>
    <section class="carte">
      <div class="surtitre-carte">TES SÉANCES</div>
      ${ligne('Séances faites', `${b.seances.faites} / ${b.seances.total}`, `${b.seances.regularite} % de régularité`)}
      ${b.seances.sautees ? ligne('Séances passées', b.seances.sautees) : ''}
    </section>
    ${b.charges.length ? `<section class="carte"><div class="surtitre-carte">TES CHARGES (EXERCICES PRINCIPAUX)</div>
      ${b.charges.map((c) => ligne(esc(c.exercice), `${nombre(c.depart)} → ${nombre(c.record)} kg`, c.gain > 0 ? `+${nombre(c.gain)} kg (+${c.pourcent} %)` : 'stable')).join('')}
    </section>` : ''}
    ${b.poids || b.mesures.length ? `<section class="carte"><div class="surtitre-carte">TA SILHOUETTE</div>
      ${b.poids ? ligne('Poids', `${nombre(b.poids.debut)} → ${nombre(b.poids.fin)} kg`, `${ecart(b.poids.ecart)} kg`) : ''}
      ${b.mesures.map((m) => ligne(MESURES[m.cle], `${nombre(m.debut)} → ${nombre(m.fin)} cm`, `${ecart(m.ecart)} cm`)).join('')}
    </section>` : ''}
    <section class="carte encart-montee">
      <div class="surtitre-carte">ET MAINTENANT ?</div>
      <strong>Passe au niveau supérieur avec un coaching sur mesure</strong>
      <p class="petit">${perte ? 'Pour continuer à affiner ta silhouette' : 'Pour continuer à développer tes fessiers'} sans plafonner :
        un programme et une diète construits pour toi, ajustés par ${esc(NOM_COACH)} selon tes bilans. Deux formules : Autonomie (bilan chaque mois)
        ou Personnalisé (bilan chaque semaine).</p>
      <a href="#/offres" class="bouton-contour">${icone('etoile', 18)}Comparer les formules</a>
      ${lienAudit()}
    </section>
    ${etat.termine ? `<button class="bouton-contour" id="cycle-suivant-bilan">Continuer en autonomie : débloquer le cycle ${etat.pa.cycle_numero + 1}</button>` : ''}
  `);
  racine.querySelector('#cycle-suivant-bilan')?.addEventListener('click', async (e) => {
    try {
      const numero = await pendant(e.currentTarget, 'Un instant…', () => api.passerCycleSuivant());
      profil.app = { ...profil.app, cycle_numero: numero, debut_cycle: new Date().toISOString().slice(0, 10) };
      toast(`Cycle ${numero} débloqué !`);
      location.hash = '#/programme';
    } catch (err) { /* message affiché par pendant() */ }
  });
}
