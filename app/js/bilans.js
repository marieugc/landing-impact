// BILANS : retour de la coach (texte, vocal, photos avant / après), partagé par l'espace coach
// (rédaction) et l'espace élève (lecture).
import { api } from './data.js';
import { esc, icone, dateCourte, fenetre } from './ui.js';

// « Nouveau retour » : retour reçu depuis la dernière visite de l'élève sur l'onglet Progrès (par appareil)
const cleVu = (uid) => `bootyflow-retours-vu-${uid}`;
export function retourEstNouveau(b, uid) {
  if (!b.retour_le) return false;
  let vu = null;
  try { vu = localStorage.getItem(cleVu(uid)); } catch (e) { /* stockage indisponible */ }
  return !vu || new Date(b.retour_le) > new Date(vu);
}
export function marquerRetoursVus(uid) {
  try { localStorage.setItem(cleVu(uid), new Date().toISOString()); } catch (e) { /* stockage indisponible */ }
}
export async function nouveauxRetours(uid) {
  return (await api.listBilans(uid)).filter((b) => retourEstNouveau(b, uid));
}

function duree(s) {
  s = Math.max(0, Math.round(s || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// Bloc « Retour de ta coach » sous un bilan
export function retourBilanHtml(b, { pourCoach = false } = {}) {
  if (!b.retour_le) return '';
  const photos = b.retour_photos || [];
  return `<div class="retour-bilan">
    <div class="surtitre-carte">${pourCoach ? 'TON RETOUR' : 'RETOUR DE TA COACH'} · ${esc(dateCourte(b.retour_le).toUpperCase())}</div>
    ${b.retour ? `<p class="texte programme-texte">${esc(b.retour)}</p>` : ''}
    ${b.retour_audio ? `<div class="vocal">${icone('micro', 16)}<audio controls preload="metadata" data-audio-retour="${esc(b.retour_audio)}"></audio>
      ${b.retour_audio_duree ? `<small>${duree(b.retour_audio_duree)}</small>` : ''}</div>` : ''}
    ${photos.length ? `<div class="grille-photos-retour">${photos.map((c) =>
      `<button type="button" class="photo-cadre photo-retour" data-chemin="${esc(c)}" aria-label="Agrandir la photo">Photo</button>`).join('')}</div>` : ''}
  </div>`;
}

// Charge les vocaux et rend les photos agrandissables (les photos elles-mêmes sont chargées par afficherPhotos)
export async function brancherRetours(zone) {
  zone.querySelectorAll('.photo-retour').forEach((b) => b.addEventListener('click', () => {
    const img = b.querySelector('img');
    if (img) fenetre('Photo', `<img src="${esc(img.src)}" alt="" class="photo-agrandie">`);
  }));
  for (const audio of zone.querySelectorAll('audio[data-audio-retour]')) {
    const url = await api.mediaUrl(audio.dataset.audioRetour);
    if (url) audio.src = url;
  }
}
