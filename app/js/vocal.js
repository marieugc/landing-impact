// VOCAL : enregistrement de messages vocaux, partagé par le chat et les retours de bilan.
import { icone, toast } from './ui.js';

const DUREE_MAX = 180; // 3 minutes

// Format d'enregistrement préféré du navigateur. Quel qu'il soit, le vocal est ensuite converti en WAV
// avant l'envoi : le WebM de Chrome / Firefox ne se lit pas sur iPhone, et le MP4 « en morceaux » de Chrome
// n'a pas de durée lisible partout. Le WAV se lit sur tous les téléphones et ordinateurs.
export function formatAudio() {
  const formats = ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
  return formats.find((f) => window.MediaRecorder?.isTypeSupported?.(f)) || '';
}

// Convertit un enregistrement en WAV mono 16 kHz (qualité voix, ~2 Mo par minute), lisible sur tous les téléphones
export async function versWav(blob) {
  const Contexte = window.AudioContext || window.webkitAudioContext;
  const ctx = new Contexte();
  try {
    const source = await ctx.decodeAudioData(await blob.arrayBuffer());
    const frequence = 16000;
    const hors = new OfflineAudioContext(1, Math.ceil(source.duration * frequence), frequence);
    const lecteur = hors.createBufferSource();
    lecteur.buffer = source;
    lecteur.connect(hors.destination);
    lecteur.start();
    const rendu = await hors.startRendering();
    return encoderWav(rendu.getChannelData(0), frequence);
  } finally {
    ctx.close?.();
  }
}
function encoderWav(echantillons, frequence) {
  const tampon = new ArrayBuffer(44 + echantillons.length * 2);
  const v = new DataView(tampon);
  const texte = (pos, t) => [...t].forEach((c, i) => v.setUint8(pos + i, c.charCodeAt(0)));
  texte(0, 'RIFF'); v.setUint32(4, 36 + echantillons.length * 2, true); texte(8, 'WAVE');
  texte(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, frequence, true); v.setUint32(28, frequence * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  texte(36, 'data'); v.setUint32(40, echantillons.length * 2, true);
  echantillons.forEach((s, i) => {
    const x = Math.max(-1, Math.min(1, s));
    v.setInt16(44 + i * 2, x < 0 ? x * 0x8000 : x * 0x7fff, true);
  });
  return new Blob([tampon], { type: 'audio/wav' });
}
export function extension(type) {
  if (type.includes('wav')) return 'wav';
  if (type.includes('mp4')) return 'm4a';
  if (type.includes('ogg')) return 'ogg';
  return 'webm';
}

function duree(s) {
  s = Math.max(0, Math.round(s || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// Petit enregistreur à placer dans un formulaire : « Enregistrer un vocal » → chrono → aperçu à réécouter.
// Renvoie { fichier(), duree(), vider() } ; fichier() vaut null tant qu'aucun vocal n'est prêt.
export function enregistreurVocal(conteneur) {
  let fichier = null, secondes = 0, enregistreur = null, morceaux = [], debut = 0, tic = null, urlApercu = null;

  function afficher(etat) {
    if (etat === 'vide') {
      conteneur.innerHTML = `<button type="button" class="bouton-contour compact" data-vocal="go">${icone('micro', 16)}Enregistrer un vocal</button>`;
    } else if (etat === 'enregistrement') {
      conteneur.innerHTML = `<div class="saisie-vocal"><span class="point-rouge" aria-hidden="true"></span><span class="chrono">0:00</span>
        <button type="button" class="lien" data-vocal="annuler">Annuler</button>
        <button type="button" class="bouton-principal compact" data-vocal="stop">TERMINER</button></div>`;
    } else {
      conteneur.innerHTML = `<div class="vocal">${icone('micro', 16)}<audio controls src="${urlApercu}"></audio><small>${duree(secondes)}</small>
        <button type="button" class="bouton-icone" data-vocal="suppr" aria-label="Supprimer le vocal">${icone('poubelle', 16)}</button></div>`;
    }
  }

  function arreterFlux() {
    clearInterval(tic);
    enregistreur?.stream.getTracks().forEach((t) => t.stop());
  }

  conteneur.addEventListener('click', async (e) => {
    const action = e.target.closest('[data-vocal]')?.dataset.vocal;
    if (action === 'go') {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        toast("Ton navigateur ne permet pas d'enregistrer un vocal.", true);
        return;
      }
      let flux;
      try { flux = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (err) {
        toast("Autorise l'accès au micro pour enregistrer un vocal.", true);
        return;
      }
      const format = formatAudio();
      enregistreur = new MediaRecorder(flux, format ? { mimeType: format } : undefined);
      morceaux = [];
      let garder = true;
      enregistreur.addEventListener('dataavailable', (ev) => { if (ev.data.size) morceaux.push(ev.data); });
      enregistreur.addEventListener('stop', async () => {
        secondes = (Date.now() - debut) / 1000;
        let type = (enregistreur.mimeType || format || 'audio/webm').split(';')[0];
        arreterFlux();
        if (!enregistreur.garder || secondes < 1 || !morceaux.length) { afficher('vide'); return; }
        let son = new Blob(morceaux, { type });
        try { son = await versWav(son); type = 'audio/wav'; } catch (err) { /* original */ }
        fichier = new File([son], `vocal.${extension(type)}`, { type });
        if (urlApercu) URL.revokeObjectURL(urlApercu);
        urlApercu = URL.createObjectURL(son);
        afficher('pret');
      });
      enregistreur.garder = garder;
      enregistreur.start();
      debut = Date.now();
      afficher('enregistrement');
      tic = setInterval(() => {
        const s = (Date.now() - debut) / 1000;
        const chrono = conteneur.querySelector('.chrono');
        if (chrono) chrono.textContent = duree(s);
        if (s >= DUREE_MAX) enregistreur?.stop();
      }, 250);
    } else if (action === 'stop') {
      enregistreur.garder = true;
      enregistreur.stop();
    } else if (action === 'annuler') {
      enregistreur.garder = false;
      enregistreur.stop();
    } else if (action === 'suppr') {
      fichier = null;
      afficher('vide');
    }
  });

  afficher('vide');
  return {
    fichier: () => fichier,
    duree: () => Math.round(secondes),
    vider() { fichier = null; afficher('vide'); }
  };
}
