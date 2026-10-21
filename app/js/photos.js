// PHOTOS jointes (messages, vidéos à corriger) : grille de miniatures agrandissables
// et préparation des fichiers (compression) avant envoi.
import { api, MODE } from './data.js';
import { esc, fenetre, compresserImage, toast } from './ui.js';

export const MAX_PHOTOS = 6;

// Les liens des photos sont gardés pour ne pas les redemander à chaque rafraîchissement du chat
const urls = new Map();
async function urlPhoto(chemin) {
  if (!urls.has(chemin)) urls.set(chemin, await api.mediaUrl(chemin));
  return urls.get(chemin);
}

export function grillePhotos(chemins) {
  if (!chemins?.length) return '';
  return `<div class="grille-photos-retour">${chemins.map((c) =>
    `<button type="button" class="photo-cadre photo-retour" data-chemin="${esc(c)}" aria-label="Agrandir la photo">Photo</button>`).join('')}</div>`;
}

// Charge les images des miniatures pas encore affichées
export async function chargerPhotos(racine) {
  for (const cadre of racine.querySelectorAll('.photo-retour[data-chemin]:not([data-chargee])')) {
    cadre.dataset.chargee = '1';
    const url = await urlPhoto(cadre.dataset.chemin);
    cadre.innerHTML = url ? `<img src="${esc(url)}" alt="">` : (MODE === 'demo' ? 'Photo de démo' : 'Photo indisponible');
  }
}

// Agrandissement au clic, pour toutes les miniatures de l'app
document.addEventListener('click', (e) => {
  const img = e.target.closest('.photo-retour')?.querySelector('img');
  if (img) fenetre('Photo', `<img src="${esc(img.src)}" alt="" class="photo-agrandie">`);
});

// Photos choisies dans un champ fichier → fichiers compressés prêts à envoyer
export async function preparerPhotos(fichiers) {
  let liste = [...(fichiers || [])].filter((f) => f.type.startsWith('image/'));
  if (liste.length > MAX_PHOTOS) {
    toast(`${MAX_PHOTOS} photos maximum à la fois : les premières sont gardées.`, true);
    liste = liste.slice(0, MAX_PHOTOS);
  }
  return Promise.all(liste.map((f) => compresserImage(f)));
}

// Libellé d'un champ « Ajouter des photos » mis à jour selon le nombre choisi
export function suivreChoixPhotos(entree, libelle = 'Ajouter des photos') {
  entree.addEventListener('change', () => {
    const n = entree.files.length;
    entree.parentElement.classList.toggle('choisie', n > 0);
    entree.previousElementSibling.textContent = n ? `${n} photo${n > 1 ? 's' : ''} sélectionnée${n > 1 ? 's' : ''}` : libelle;
  });
}
