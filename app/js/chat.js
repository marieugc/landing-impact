// MESSAGERIE élève ↔ coach : messages texte et vocaux.
// Utilisé par l'espace élève (onglet Chat) et l'espace coach (Messages).
import { api, MODE } from './data.js';
import { esc, icone, toast, dateCourte } from './ui.js';

const RAFRAICHISSEMENT = 5000; // on regarde s'il y a de nouveaux messages toutes les 5 s
const DUREE_MAX = 180; // un vocal dure 3 minutes maximum

let minuterie = null;
const urlsAudio = new Map(); // évite de redemander le lien d'un vocal à chaque rafraîchissement

function heure(iso) {
  const d = new Date(iso);
  const hh = `${d.getHours()}h${String(d.getMinutes()).padStart(2, '0')}`;
  const aujourdhui = new Date().toDateString() === d.toDateString();
  return aujourdhui ? hh : `${dateCourte(iso)} · ${hh}`;
}
function duree(s) {
  s = Math.max(0, Math.round(s || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function bulle(m, moiCoach) {
  const moi = m.de_coach === moiCoach;
  return `<div class="bulle ${moi ? 'moi' : 'autre'}">
    ${m.audio_chemin ? `<div class="vocal">${icone('micro', 16)}<audio controls preload="metadata" data-audio="${esc(m.audio_chemin)}"></audio>
      ${m.duree ? `<small>${duree(m.duree)}</small>` : ''}</div>` : ''}
    ${m.texte ? `<p>${esc(m.texte)}</p>` : ''}
    <time>${heure(m.created_at)}${moi && m.lu ? ' · Vu' : ''}</time>
  </div>`;
}

async function brancherAudios(fil) {
  for (const audio of fil.querySelectorAll('audio[data-audio]')) {
    const chemin = audio.dataset.audio;
    if (!urlsAudio.has(chemin)) urlsAudio.set(chemin, await api.mediaUrl(chemin));
    const url = urlsAudio.get(chemin);
    if (url) audio.src = url;
    else audio.replaceWith(Object.assign(document.createElement('small'), {
      textContent: MODE === 'demo' ? 'Vocal non conservé en démo' : 'Vocal indisponible'
    }));
  }
}

// Format d'enregistrement accepté par le navigateur (iPhone : mp4, Android/Chrome : webm)
function formatAudio() {
  const formats = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'];
  return formats.find((f) => window.MediaRecorder?.isTypeSupported?.(f)) || '';
}
function extension(type) {
  if (type.includes('mp4')) return 'm4a';
  if (type.includes('ogg')) return 'ogg';
  return 'webm';
}

export function arreterChat() {
  clearInterval(minuterie);
  minuterie = null;
}

// Affiche une conversation dans `zone`. moiCoach : true côté coach.
export async function conversation(zone, { eleveId, moiCoach, titre, sousTitre = '', avatar = '' }) {
  arreterChat();
  zone.innerHTML = `<section class="conversation">
    <header class="conversation-tete">${avatar}<div><strong>${esc(titre)}</strong>${sousTitre ? `<div class="petit">${sousTitre}</div>` : ''}</div></header>
    <div class="fil" id="fil" aria-live="polite"></div>
    <form class="saisie" id="saisie">
      <div class="saisie-texte">
        <textarea name="texte" rows="1" placeholder="Écris ton message…" aria-label="Message"></textarea>
        <button type="button" class="bouton-rond micro" id="micro" aria-label="Enregistrer un vocal">${icone('micro', 20)}</button>
        <button type="submit" class="bouton-rond envoyer" aria-label="Envoyer">${icone('avion', 18)}</button>
      </div>
      <div class="saisie-vocal" hidden>
        <span class="point-rouge" aria-hidden="true"></span><span class="chrono">0:00</span>
        <span class="petit">Enregistrement…</span>
        <button type="button" class="lien" id="annuler-vocal">Annuler</button>
        <button type="button" class="bouton-principal compact" id="envoyer-vocal">${icone('avion', 16)}ENVOYER</button>
      </div>
    </form>
  </section>`;

  const fil = zone.querySelector('#fil');
  const form = zone.querySelector('#saisie');
  const champ = form.querySelector('textarea');
  let signature = '';

  async function charger(forcerBas = false) {
    const messages = await api.listMessages(eleveId);
    const nouvelle = messages.map((m) => `${m.id}${m.lu ? 1 : 0}`).join();
    if (nouvelle === signature) return;
    const etaitEnBas = fil.scrollHeight - fil.scrollTop - fil.clientHeight < 80;
    signature = nouvelle;
    fil.innerHTML = messages.length
      ? messages.map((m) => bulle(m, moiCoach)).join('')
      : `<p class="vide">${moiCoach ? 'Aucun message pour le moment. Écris le premier !' : 'Pose ici toutes tes questions à ta coach, par écrit ou en vocal.'}</p>`;
    await brancherAudios(fil);
    if (forcerBas || etaitEnBas) fil.scrollTop = fil.scrollHeight;
    if (messages.some((m) => !m.lu && m.de_coach !== moiCoach)) {
      await api.markMessagesLus(eleveId, moiCoach);
      document.dispatchEvent(new CustomEvent('messages-lus'));
    }
  }

  async function envoyer(contenu) {
    await api.sendMessage(eleveId, { deCoach: moiCoach, ...contenu });
    await charger(true);
  }

  // Texte : Entrée envoie sur ordinateur, Maj + Entrée passe à la ligne
  champ.addEventListener('input', () => {
    champ.style.height = 'auto';
    champ.style.height = `${Math.min(champ.scrollHeight, 120)}px`;
  });
  champ.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && window.matchMedia('(hover: hover)').matches) {
      e.preventDefault();
      form.requestSubmit();
    }
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const texte = champ.value.trim();
    if (!texte) return;
    champ.value = '';
    champ.style.height = 'auto';
    try { await envoyer({ texte }); } catch (err) { champ.value = texte; toast(err.message, true); }
  });

  // Vocal
  const zoneTexte = form.querySelector('.saisie-texte');
  const zoneVocal = form.querySelector('.saisie-vocal');
  const chrono = form.querySelector('.chrono');
  let enregistreur = null, morceaux = [], debut = 0, tic = null, aEnvoyer = false;

  function finVocal() {
    clearInterval(tic);
    enregistreur?.stream.getTracks().forEach((t) => t.stop());
    enregistreur = null;
    zoneVocal.hidden = true;
    zoneTexte.hidden = false;
  }

  form.querySelector('#micro').addEventListener('click', async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      toast("Ton navigateur ne permet pas d'enregistrer un vocal. Mets-le à jour ou essaie avec Safari / Chrome.", true);
      return;
    }
    let flux;
    try {
      flux = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      toast("Autorise l'accès au micro pour envoyer un vocal (réglages du téléphone ou du navigateur).", true);
      return;
    }
    const format = formatAudio();
    enregistreur = new MediaRecorder(flux, format ? { mimeType: format } : undefined);
    morceaux = [];
    aEnvoyer = false;
    enregistreur.addEventListener('dataavailable', (e) => { if (e.data.size) morceaux.push(e.data); });
    enregistreur.addEventListener('stop', async () => {
      const secondes = (Date.now() - debut) / 1000;
      const type = (enregistreur?.mimeType || format || 'audio/webm').split(';')[0];
      finVocal();
      if (!aEnvoyer || !morceaux.length) return;
      if (secondes < 1) { toast('Vocal trop court.', true); return; }
      const fichier = new File([new Blob(morceaux, { type })], `vocal.${extension(type)}`, { type });
      try { await envoyer({ audio: fichier, duree: Math.round(secondes) }); } catch (err) { toast(err.message, true); }
    });
    enregistreur.start();
    debut = Date.now();
    chrono.textContent = '0:00';
    zoneTexte.hidden = true;
    zoneVocal.hidden = false;
    tic = setInterval(() => {
      const s = (Date.now() - debut) / 1000;
      chrono.textContent = duree(s);
      if (s >= DUREE_MAX) { aEnvoyer = true; enregistreur?.stop(); }
    }, 250);
  });
  form.querySelector('#envoyer-vocal').addEventListener('click', () => { aEnvoyer = true; enregistreur?.stop(); });
  form.querySelector('#annuler-vocal').addEventListener('click', () => { aEnvoyer = false; enregistreur?.stop(); });

  await charger(true);
  minuterie = setInterval(() => {
    if (!document.body.contains(fil)) { arreterChat(); return; }
    if (!document.hidden) charger().catch(() => {});
  }, RAFRAICHISSEMENT);
  window.addEventListener('hashchange', () => { arreterChat(); if (enregistreur) { aEnvoyer = false; enregistreur.stop(); } }, { once: true });
}

// Nombre de messages non lus reçus (élève : ceux de la coach ; coach : ceux de toutes les élèves)
export async function nonLus(eleveId, moiCoach) {
  const messages = await api.listMessages(eleveId);
  return messages.filter((m) => !m.lu && m.de_coach !== moiCoach).length;
}
