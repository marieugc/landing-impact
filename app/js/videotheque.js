// VIDÉOTHÈQUE : vidéos d'explication des mouvements, communes à toutes les élèves.
// Outils partagés par l'espace élève (consultation) et l'espace coach (ajout).
import { api, MODE } from './data.js';
import { esc, icone, fenetre } from './ui.js';

export const CATEGORIES = ['Fessiers', 'Jambes', 'Haut du corps', 'Abdos / gainage', 'Échauffement', 'Mobilité / étirements', 'Posing', 'Autre'];

// Reconnaît un lien YouTube ou Vimeo pour l'afficher directement dans l'app
function lienIntegre(lien) {
  if (!lien) return null;
  try {
    const u = new URL(lien);
    const hote = u.hostname.replace(/^www\.|^m\./, '');
    let id = null;
    if (hote === 'youtu.be') id = u.pathname.slice(1);
    else if (hote.endsWith('youtube.com')) id = u.searchParams.get('v') || u.pathname.match(/\/(shorts|embed|live)\/([^/?]+)/)?.[2];
    if (id) return { type: 'youtube', id, url: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&playsinline=1` };
    const vimeo = hote.endsWith('vimeo.com') && u.pathname.match(/\/(\d+)/)?.[1];
    if (vimeo) return { type: 'vimeo', id: vimeo, url: `https://player.vimeo.com/video/${vimeo}` };
  } catch (e) { /* lien invalide */ }
  return null;
}

export function lienValide(lien) {
  try { return ['http:', 'https:'].includes(new URL(lien).protocol); } catch (e) { return false; }
}

export function estNouvelle(v, profil) {
  return !profil.biblio_vue_le || new Date(v.created_at) > new Date(profil.biblio_vue_le);
}
export async function nouveautes(profil) {
  const liste = await api.listBibliotheque();
  return liste.filter((v) => estNouvelle(v, profil));
}

// Miniature : image YouTube, première image de la vidéo envoyée, sinon une icône
export function vignette(v) {
  const integre = lienIntegre(v.lien);
  if (integre?.type === 'youtube') {
    return `<span class="biblio-vignette"><img src="https://i.ytimg.com/vi/${esc(integre.id)}/hqdefault.jpg" alt="" loading="lazy" onerror="this.remove()">${icone('lecture', 22, '#fff', true)}</span>`;
  }
  return `<span class="biblio-vignette" ${v.chemin ? `data-miniature="${esc(v.chemin)}"` : ''}>${icone('lecture', 22, '#E3C8FF', true)}</span>`;
}

// Charge la première image des vidéos envoyées dans l'app
export async function chargerMiniatures(zone) {
  for (const el of zone.querySelectorAll('[data-miniature]')) {
    const url = await api.mediaUrl(el.dataset.miniature);
    if (url) el.insertAdjacentHTML('afterbegin', `<video src="${esc(url)}#t=0.5" preload="metadata" muted playsinline aria-hidden="true"></video>`);
  }
}

export async function ouvrirVideo(v) {
  const integre = lienIntegre(v.lien);
  let lecteur;
  if (integre) {
    lecteur = `<div class="cadre-video"><iframe src="${esc(integre.url)}" title="${esc(v.titre)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`;
  } else if (v.chemin) {
    const url = await api.mediaUrl(v.chemin);
    lecteur = url
      ? `<video src="${esc(url)}" controls playsinline class="lecteur"></video>`
      : `<p class="vide">${MODE === 'demo' ? "Vidéo d'exemple : pas de fichier en mode démo." : 'Vidéo indisponible.'}</p>`;
  } else if (v.lien && lienValide(v.lien)) {
    lecteur = `<a class="bouton-principal" href="${esc(v.lien)}" target="_blank" rel="noopener">${icone('lecture', 18)}OUVRIR LA VIDÉO</a>`;
  } else {
    lecteur = `<p class="vide">${MODE === 'demo' ? "Vidéo d'exemple : pas de fichier en mode démo." : 'Vidéo indisponible.'}</p>`;
  }
  fenetre(v.titre, `${lecteur}
    <div class="biblio-detail"><span class="badge" style="color:var(--accent);border-color:var(--accent)">${esc(v.categorie)}</span>
    ${v.description ? `<p>${esc(v.description)}</p>` : ''}</div>`);
}
