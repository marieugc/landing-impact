// TRAINING : programmes d'entraînement déposés par la coach pour chaque élève.
// Outils partagés par l'espace élève (consultation) et l'espace coach (dépôt).
import { api, MODE } from './data.js';
import { esc, icone, dateCourte, toast } from './ui.js';
import { lienValide } from './videotheque.js';

// « Nouveau » : programme ajouté depuis la dernière visite de l'élève sur cet appareil
const cleVu = (uid) => `bootyflow-training-vu-${uid}`;
function derniereVisite(uid) {
  try { return localStorage.getItem(cleVu(uid)); } catch (e) { return null; }
}
export function marquerTrainingVu(uid) {
  try { localStorage.setItem(cleVu(uid), new Date().toISOString()); } catch (e) { /* stockage indisponible */ }
}
export function estNouveau(p, uid) {
  const vu = derniereVisite(uid);
  return !vu || new Date(p.created_at) > new Date(vu);
}
export async function nouveauxProgrammes(uid) {
  return (await api.listProgrammes(uid)).filter((p) => estNouveau(p, uid));
}

function typeFichier(nom = '') {
  const ext = nom.split('.').pop().toLowerCase();
  if (ext === 'pdf') return 'PDF';
  if (['jpg', 'jpeg', 'png', 'heic', 'webp'].includes(ext)) return 'Image';
  if (['xls', 'xlsx', 'csv', 'numbers'].includes(ext)) return 'Tableur';
  if (['doc', 'docx', 'pages'].includes(ext)) return 'Document';
  return 'Fichier';
}

// Carte d'un programme. Les liens des fichiers sont remplis ensuite par brancherFichiers()
export function carteProgramme(p, { enCours = false, nouveau = false, modifiable = false } = {}) {
  return `<article class="carte programme${enCours ? ' en-cours' : ''}">
    <div class="ligne-entre">
      <div class="surtitre-carte">${enCours ? 'PROGRAMME EN COURS' : `AJOUTÉ LE ${esc(dateCourte(p.created_at).toUpperCase())}`}</div>
      ${nouveau ? '<span class="badge-nouveau">NOUVEAU</span>' : ''}
    </div>
    <strong class="titre-carte">${esc(p.titre)}</strong>
    ${enCours ? `<span class="petit">Ajouté le ${dateCourte(p.created_at)}</span>` : ''}
    ${p.description ? `<p class="texte programme-texte">${esc(p.description)}</p>` : ''}
    <div class="actions-programme">
      ${p.chemin ? `
        <a class="bouton-principal compact" data-ouvrir="${esc(p.chemin)}" target="_blank" rel="noopener" aria-disabled="true">${icone('doc', 18)}OUVRIR${p.nom_fichier ? ` · ${typeFichier(p.nom_fichier)}` : ''}</a>
        <a class="bouton-contour compact" data-telecharger="${esc(p.chemin)}" data-nom="${esc(p.nom_fichier || 'programme')}" aria-disabled="true">${icone('telecharger', 16)}Télécharger</a>` : ''}
      ${p.lien && lienValide(p.lien) ? `<a class="bouton-contour compact" href="${esc(p.lien)}" target="_blank" rel="noopener">${icone('doc', 16)}Ouvrir le lien</a>` : ''}
      ${modifiable ? `<span class="actions-coach">
        <button class="bouton-contour compact" data-modifier-prog="${esc(p.id)}">Modifier</button>
        <button class="bouton-icone" data-supprimer-prog="${esc(p.id)}" aria-label="Supprimer ${esc(p.titre)}">${icone('poubelle', 18)}</button>
      </span>` : ''}
    </div>
  </article>`;
}

// Prépare les liens « Ouvrir » et « Télécharger » à l'avance : sur iPhone, un lien ouvert
// après une attente serait bloqué comme fenêtre surgissante.
export async function brancherFichiers(zone) {
  zone.querySelectorAll('[data-ouvrir], [data-telecharger]').forEach((a) => a.addEventListener('click', (e) => {
    if (a.getAttribute('aria-disabled') === 'true') {
      e.preventDefault();
      toast(a.title || 'Le fichier se prépare, réessaie dans une seconde.', !a.title ? false : true);
    }
  }));
  for (const a of zone.querySelectorAll('[data-ouvrir]')) {
    const url = await api.mediaUrl(a.dataset.ouvrir);
    activerLien(a, url);
  }
  for (const a of zone.querySelectorAll('[data-telecharger]')) {
    const url = await api.mediaUrl(a.dataset.telecharger, a.dataset.nom);
    if (url) a.setAttribute('download', a.dataset.nom);
    activerLien(a, url);
  }
}
function activerLien(a, url) {
  if (url) {
    a.href = url;
    a.removeAttribute('aria-disabled');
  } else {
    a.title = MODE === 'demo' ? "Programme d'exemple : pas de fichier en mode démo." : 'Fichier indisponible.';
  }
}
