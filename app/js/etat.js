// ÉTAT DE FORME : curseurs remplis par l'élève dans son bilan (difficulté, énergie, récupération,
// sommeil, motivation) et lecture côté coach (forme globale, évolution, vigilance).
import { esc, ecart } from './ui.js';

// « positif » : une note haute est une bonne nouvelle (la difficulté se lit à part)
export const CRITERES = [
  { cle: 'difficulte', libelle: 'Difficulté des entraînements', bas: 'Très facile', haut: 'Très dur', positif: false },
  { cle: 'energie', libelle: "Niveau d'énergie", bas: 'À plat', haut: 'Au top', positif: true },
  { cle: 'recuperation', libelle: 'Récupération (courbatures, fatigue)', bas: 'Pas récupérée', haut: 'Bien récupérée', positif: true },
  { cle: 'sommeil', libelle: 'Qualité du sommeil', bas: 'Très mauvais', haut: 'Excellent', positif: true },
  { cle: 'motivation', libelle: 'Motivation', bas: 'Aucune', haut: 'À fond', positif: true }
];
export const SEUIL_VIGILANCE = 4;

// Moyenne des critères positifs renseignés (énergie, récupération, sommeil, motivation), sur 10
export function formeGlobale(b) {
  const notes = CRITERES.filter((c) => c.positif).map((c) => b?.[c.cle]).filter((v) => v != null);
  if (!notes.length) return null;
  return Math.round((notes.reduce((s, v) => s + Number(v), 0) / notes.length) * 10) / 10;
}

function niveau(note, positif = true) {
  const n = positif ? note : 11 - note;
  if (n <= SEUIL_VIGILANCE) return 'basse';
  if (n <= 6) return 'moyenne';
  return 'bonne';
}

// Curseurs du formulaire de bilan : seuls ceux que l'élève a touchés sont envoyés
export function curseursHtml() {
  return CRITERES.map((c) => `<div class="curseur" data-critere="${c.cle}">
      <div class="ligne-entre"><label for="curseur-${c.cle}">${esc(c.libelle)}</label><output class="note-curseur">Glisse pour noter</output></div>
      <input type="range" id="curseur-${c.cle}" name="${c.cle}" min="1" max="10" step="1" value="5" aria-describedby="bornes-${c.cle}">
      <div class="bornes petit" id="bornes-${c.cle}"><span>1 · ${esc(c.bas)}</span><span>${esc(c.haut)} · 10</span></div>
    </div>`).join('');
}

export function brancherCurseurs(form) {
  form.querySelectorAll('.curseur').forEach((bloc) => {
    const entree = bloc.querySelector('input');
    const sortie = bloc.querySelector('output');
    const critere = CRITERES.find((c) => c.cle === bloc.dataset.critere);
    const maj = () => {
      bloc.dataset.touche = '1';
      const v = Number(entree.value);
      sortie.textContent = `${v} / 10`;
      bloc.dataset.niveau = niveau(v, critere.positif);
      entree.style.setProperty('--rempli', `${((v - 1) / 9) * 100}%`);
    };
    entree.addEventListener('input', maj);
    entree.addEventListener('change', maj);
  });
}

// Valeurs à enregistrer (null pour un curseur jamais touché)
export function lireCurseurs(form) {
  const valeurs = {};
  form.querySelectorAll('.curseur').forEach((bloc) => {
    valeurs[bloc.dataset.critere] = bloc.dataset.touche ? Number(bloc.querySelector('input').value) : null;
  });
  return valeurs;
}

// Bloc « État de la semaine » d'un bilan (coach et élève), avec l'écart au bilan précédent
export function etatHtml(b, precedent, { pourCoach = false } = {}) {
  const notes = CRITERES.filter((c) => b?.[c.cle] != null);
  if (!notes.length) return '';
  const forme = formeGlobale(b);
  const formeAvant = formeGlobale(precedent);
  const lignes = notes.map((c) => {
    const v = Number(b[c.cle]);
    const avant = precedent?.[c.cle];
    return `<div class="etat-ligne" data-niveau="${niveau(v, c.positif)}">
      <span class="etat-libelle">${esc(c.libelle)}</span>
      <span class="etat-barre" aria-hidden="true"><i style="width:${v * 10}%"></i></span>
      <span class="etat-note"><strong>${v}</strong>/10${avant != null ? ` <small>${ecart(v - avant, 0)}</small>` : ''}</span>
    </div>`;
  }).join('');
  return `<div class="etat-semaine">
    <div class="ligne-entre"><span class="surtitre-carte">ÉTAT DE LA SEMAINE</span>
      ${forme != null ? `<span class="forme-globale" data-niveau="${niveau(forme)}">Forme ${String(forme).replace('.', ',')}/10${formeAvant != null ? ` <small>${ecart(forme - formeAvant)}</small>` : ''}</span>` : ''}</div>
    ${pourCoach && forme != null && forme <= SEUIL_VIGILANCE ? '<p class="alerte-forme">Forme basse cette semaine : pense à prendre de ses nouvelles ou à alléger.</p>' : ''}
    ${lignes}
  </div>`;
}
