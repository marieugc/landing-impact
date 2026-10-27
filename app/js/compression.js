// COMPRESSION DES VIDÉOS avant l'envoi : une vidéo de téléphone (1080p ou 4K, 30 à 50 Mo pour quelques
// secondes) est réencodée en 720p, environ 2 Mb/s, MP4 H.264 « fast start ». Résultat : 5 à 10 fois plus
// légère, et la lecture démarre tout de suite au lieu d'attendre le téléchargement du fichier.
// Tout se fait sur le téléphone (WebCodecs, accéléré par le matériel) grâce à Mediabunny (app/vendor).
// Si l'appareil ne sait pas faire, la vidéo d'origine est envoyée telle quelle.

const COTE = 720;           // plus petit côté de la vidéo, en pixels
const DEBIT = 2_000_000;    // bits par seconde : net pour corriger un mouvement, léger à lire
const SEUIL = 6 * 1024 * 1024; // en dessous de 6 Mo, la vidéo est déjà légère : on n'y touche pas

let bibliotheque = null;
const charger = () => (bibliotheque ??= import('../vendor/mediabunny/mediabunny.min.mjs'));

const pair = (n) => Math.max(2, Math.round(n / 2) * 2);

// codecs : formats essayés dans l'ordre ; H.264 (« avc ») se lit partout, iPhone compris
export async function compresserVideo(fichier, { onProgress, codecs = ['avc'] } = {}) {
  if (!fichier || fichier.size < SEUIL || !('VideoEncoder' in window)) return fichier;
  try {
    const { Input, ALL_FORMATS, BlobSource, Output, Mp4OutputFormat, BufferTarget, Conversion, canEncodeVideo } = await charger();
    const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(fichier) });
    const piste = await input.getPrimaryVideoTrack();
    if (!piste) return fichier;
    const court = Math.min(piste.displayWidth, piste.displayHeight);
    const echelle = Math.min(1, COTE / court);
    const largeur = pair(piste.displayWidth * echelle);
    const hauteur = pair(piste.displayHeight * echelle);
    let codec = null;
    for (const c of codecs) {
      if (await canEncodeVideo(c, { width: largeur, height: hauteur, bitrate: DEBIT })) { codec = c; break; }
    }
    if (!codec) return fichier;

    const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target: new BufferTarget() });
    const conversion = await Conversion.init({
      input, output, tracks: 'primary', showWarnings: false,
      // Rotation appliquée aux images : la vidéo garde le bon sens sur tous les lecteurs
      video: { width: largeur, height: hauteur, fit: 'contain', codec, bitrate: DEBIT, frameRate: 30, allowRotationMetadata: false, forceTranscode: true }
      // Son : copié tel quel quand c'est possible (AAC des téléphones), sinon réencodé par Mediabunny
    });
    // Une piste abandonnée (son ou image impossible à convertir) : on garde l'original plutôt qu'une vidéo muette
    if (!conversion.isValid || conversion.discardedTracks.length) return fichier;
    if (onProgress) conversion.onProgress = (p) => onProgress(p);
    await conversion.execute();
    const resultat = new File([output.target.buffer], `${fichier.name.replace(/\.[^.]+$/, '') || 'video'}.mp4`, { type: 'video/mp4' });
    return resultat.size < fichier.size ? resultat : fichier;
  } catch (e) {
    console.warn('Compression vidéo impossible, envoi de l\'original', e);
    return fichier;
  }
}

// Allège la vidéo en affichant la progression sur le bouton d'envoi
export async function preparerVideo(fichier, bouton) {
  if (!fichier) return null;
  const maj = (p) => { if (bouton) bouton.textContent = `Allègement de la vidéo… ${Math.round(p * 100)} %`; };
  if (fichier.size >= SEUIL) maj(0);
  const resultat = await compresserVideo(fichier, { onProgress: maj });
  if (bouton) bouton.textContent = 'Envoi de la vidéo…';
  return resultat;
}

// Vidéo prête à envoyer : allégée, puis refusée si elle dépasse encore la limite de stockage
export const TAILLE_MAX = 50 * 1024 * 1024;
export async function videoPrete(fichier, bouton, conseil = 'Vidéo trop lourde, même allégée (50 Mo max). Coupe-la ou mets-la sur YouTube en « non répertoriée ».') {
  const video = await preparerVideo(fichier, bouton);
  if (video && video.size > TAILLE_MAX) throw new Error(conseil);
  return video;
}
