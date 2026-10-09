// Démarrage de l'app : connexion, choix élève/coach, navigation entre les écrans.
import { api, MODE } from './data.js';
import { esc, icone, toast, pendant, fenetre, VERSION_APP } from './ui.js';
import { ecransEleve } from './eleve.js';
import { ecransCoach } from './coach.js';
import { nonLus } from './chat.js';
import { nouveautes } from './videotheque.js';
import { nouveauxProgrammes } from './programmes.js';

const racine = document.getElementById('app');
let profil = null;

// ───────────── Installation sur l'écran d'accueil ─────────────
let invitationInstall = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  invitationInstall = e;
  document.querySelector('#installer')?.removeAttribute('hidden');
});
const estIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const estInstallee = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;

async function installer() {
  if (invitationInstall) {
    invitationInstall.prompt();
    await invitationInstall.userChoice;
    invitationInstall = null;
    document.querySelector('#installer')?.setAttribute('hidden', '');
  } else if (estIOS) {
    fenetre("Installer l'app", `<ol class="etapes">
      <li>Ouvre cette page dans <strong>Safari</strong>.</li>
      <li>Touche le bouton <strong>Partager</strong> (carré avec une flèche vers le haut).</li>
      <li>Choisis <strong>« Sur l'écran d'accueil »</strong>, puis <strong>Ajouter</strong>.</li></ol>`);
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

// ───────────── Mises à jour automatiques ─────────────
// Sur téléphone, l'app installée reste souvent ouverte en arrière-plan avec l'ancienne version.
// À chaque ouverture (et retour sur l'app), on compare avec version.json publié sur le site.
let bandeauMaj = false;
async function verifierMiseAJour() {
  if (bandeauMaj) return;
  try {
    const rep = await fetch(`version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!rep.ok) return;
    const { version } = await rep.json();
    if (version && String(version) !== VERSION_APP) afficherBandeauMaj(version);
  } catch (e) { /* hors ligne : on réessaiera */ }
}
function afficherBandeauMaj(version) {
  bandeauMaj = true;
  const el = document.createElement('div');
  el.className = 'bandeau-maj';
  el.setAttribute('role', 'status');
  el.innerHTML = `<span>Nouvelle version disponible (${esc(version)})</span><button class="bouton-principal compact">METTRE À JOUR</button>`;
  el.querySelector('button').addEventListener('click', mettreAJour);
  document.body.appendChild(el);
}
async function mettreAJour() {
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    await reg?.update();
    if (window.caches) await Promise.all((await caches.keys()).map((c) => caches.delete(c)));
  } catch (e) { /* on recharge quand même */ }
  location.reload();
}
window.addEventListener('load', verifierMiseAJour);
document.addEventListener('visibilitychange', () => { if (!document.hidden) verifierMiseAJour(); });

// ───────────── Écrans de connexion ─────────────
function bandeauDemo() {
  return MODE === 'demo' ? `<div class="bandeau-demo">Mode démo : données fictives, rien n'est envoyé en ligne.</div>` : '';
}

function ecranConnexion(onglet = 'connexion') {
  const inscription = onglet === 'inscription';
  racine.innerHTML = `<div class="connexion">
    ${bandeauDemo()}
    <img src="img/banniere.jpg" alt="Booty Flow Coaching" class="banniere">
    <div class="bonjour centre">${inscription ? 'Bienvenue !' : 'Contente de te revoir'}</div>
    <div class="filtres centre" role="tablist">
      <button class="filtre${inscription ? '' : ' actif'}" data-onglet="connexion" role="tab" aria-selected="${!inscription}">Se connecter</button>
      <button class="filtre${inscription ? ' actif' : ''}" data-onglet="inscription" role="tab" aria-selected="${inscription}">Créer mon compte</button>
    </div>
    <form class="formulaire carte" id="form-connexion">
      ${inscription ? '<label>Prénom<input name="prenom" autocomplete="given-name" required></label>' : ''}
      <label>Adresse e-mail<input name="email" type="email" autocomplete="email" required></label>
      <label>Mot de passe<input name="mdp" type="password" autocomplete="${inscription ? 'new-password' : 'current-password'}" minlength="6" ${MODE === 'demo' && !inscription ? '' : 'required'}></label>
      <button class="bouton-principal" type="submit">${inscription ? 'CRÉER MON COMPTE' : 'ME CONNECTER'}</button>
      ${inscription ? '' : '<button type="button" class="lien" id="oubli">Mot de passe oublié ?</button>'}
    </form>
    ${MODE === 'demo' ? `<div class="carte essais">
      <div class="surtitre-carte">ESSAYER LA DÉMO</div>
      <button class="bouton-contour" data-demo="sarah@demo.fr">${icone('accueil', 18)}Espace élève (Sarah)</button>
      <button class="bouton-contour" data-demo="chloe@demo.fr">${icone('etoile', 18)}Espace compétitrice (Chloé)</button>
      <button class="bouton-contour" data-demo="marie@demo.fr">${icone('eleves', 18)}Espace coach (Marie)</button>
      <button class="lien" id="reinit">Remettre la démo à zéro</button>
    </div>` : ''}
    <p class="version">Version ${VERSION_APP}</p>
  </div>`;

  racine.querySelectorAll('[data-onglet]').forEach((b) => b.addEventListener('click', () => ecranConnexion(b.dataset.onglet)));

  racine.querySelector('#form-connexion').addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = new FormData(e.target);
    try {
      if (inscription) {
        const { confirmationRequise } = await pendant(e.submitter, 'Création…', () =>
          api.signUp(d.get('email'), d.get('mdp'), d.get('prenom').trim()));
        if (confirmationRequise) {
          fenetre('Vérifie tes e-mails', `<p>On t'a envoyé un lien de confirmation à <strong>${esc(d.get('email'))}</strong>. Clique dessus, puis reviens te connecter ici.</p>`);
          ecranConnexion('connexion');
          return;
        }
      } else {
        await pendant(e.submitter, 'Connexion…', () => api.signIn(d.get('email'), d.get('mdp')));
      }
      demarrer();
    } catch (err) { /* message déjà affiché */ }
  });

  racine.querySelector('#oubli')?.addEventListener('click', () => {
    if (MODE === 'demo') { toast('En démo, pas besoin de mot de passe.'); return; }
    const f = fenetre('Mot de passe oublié', `<form class="formulaire" id="form-oubli">
      <label>Ton adresse e-mail<input name="email" type="email" required></label>
      <button class="bouton-principal" type="submit">RECEVOIR UN LIEN</button></form>`);
    f.querySelector('form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await pendant(e.submitter, 'Envoi…', () => api.resetPassword(new FormData(e.target).get('email')));
      f.querySelector('.fenetre-corps').innerHTML = '<p>C\'est envoyé ! Ouvre le lien reçu par e-mail pour choisir un nouveau mot de passe.</p>';
    });
  });

  racine.querySelectorAll('[data-demo]').forEach((b) => b.addEventListener('click', async () => {
    await api.signIn(b.dataset.demo);
    demarrer();
  }));
  racine.querySelector('#reinit')?.addEventListener('click', () => {
    api.reinitialiserDemo();
    toast('Démo remise à zéro.');
  });
}

function ecranNouveauMotDePasse() {
  const f = fenetre('Nouveau mot de passe', `<form class="formulaire">
    <label>Nouveau mot de passe<input name="mdp" type="password" minlength="6" autocomplete="new-password" required></label>
    <button class="bouton-principal" type="submit">ENREGISTRER</button></form>`);
  f.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await pendant(e.submitter, 'Enregistrement…', () => api.updatePassword(new FormData(e.target).get('mdp')));
    f.remove();
    toast('Mot de passe modifié.');
    demarrer();
  });
}

// ───────────── Navigation ─────────────
async function afficher() {
  if (!profil) return;
  const [racineRoute, ...reste] = location.hash.replace(/^#\/?/, '').split('/');
  const coach = profil.role === 'coach';

  try {
    if (coach) {
      if (racineRoute !== 'coach') { location.replace('#/coach'); return; }
      const [sous, ...params] = reste;
      const ecran = {
        '': ecransCoach.tableau, undefined: ecransCoach.tableau,
        eleve: ecransCoach.fiche, videos: ecransCoach.videos, bilans: ecransCoach.bilans,
        competitrices: ecransCoach.competitrices, nutrition: ecransCoach.plansNutrition,
        charges: ecransCoach.suiviCharges, messages: ecransCoach.messages,
        videotheque: ecransCoach.videotheque
      }[sous] || ecransCoach.tableau;
      await ecran(racine, profil, params);
    } else {
      const ecran = ecransEleve[racineRoute];
      if (!ecran) { location.replace('#/accueil'); return; }
      await ecran(racine, profil);
      racine.querySelector('.mobile-contenu')?.scrollTo(0, 0);
    }
  } catch (e) {
    console.error(e);
    racine.innerHTML = `<div class="connexion"><div class="carte"><p>Oups, impossible de charger cette page.</p>
      <p class="petit">${esc(e.message)}</p><button class="bouton-principal" onclick="location.reload()">RÉESSAYER</button></div></div>`;
  }

  if (MODE === 'demo' && !racine.querySelector('.bandeau-demo')) racine.insertAdjacentHTML('afterbegin', bandeauDemo());
  majPastille();
  const bouton = racine.querySelector('#installer');
  if (bouton && !estInstallee && (invitationInstall || estIOS)) bouton.removeAttribute('hidden');
}

// Pastille du nombre de messages non lus sur l'onglet Chat (élève) ou Messages (coach)
// et sur l'onglet Mouvement quand la coach a ajouté des vidéos à la vidéothèque
function poserPastille(lien, n, libelle) {
  if (!lien) return;
  let pastille = lien.querySelector('.compteur');
  if (!n) { pastille?.remove(); return; }
  if (!pastille) {
    pastille = Object.assign(document.createElement('span'), { className: 'compteur' });
    lien.appendChild(pastille);
  }
  pastille.textContent = n > 9 ? '9+' : n;
  pastille.setAttribute('aria-label', libelle(n));
}
async function majPastille() {
  if (!profil) return;
  const coach = profil.role === 'coach';
  const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? 's' : ''}`;
  try {
    const n = await nonLus(coach ? null : profil.id, coach);
    poserPastille(racine.querySelector(coach ? 'a[href="#/coach/messages"]' : '[data-onglet="chat"]'), n,
      (x) => `${pluriel(x, 'message')} non lu${x > 1 ? 's' : ''}`);
    if (!coach) {
      const nouvelles = (await nouveautes(profil)).length;
      poserPastille(racine.querySelector('[data-onglet="mouvement"]'), nouvelles,
        (x) => `${pluriel(x, 'nouvelle vidéo')} dans la vidéothèque`);
      poserPastille(racine.querySelector('[data-onglet="plan"]'), (await nouveauxProgrammes(profil.id)).length,
        (x) => `${pluriel(x, 'nouveau programme')}`);
    }
  } catch (e) { /* hors ligne : on réessaiera */ }
}
document.addEventListener('messages-lus', majPastille);
setInterval(() => { if (!document.hidden) majPastille(); }, 30000);

// Branché une seule fois sur toute l'app : ces boutons marchent même quand
// un écran se redessine tout seul (filtre, correction envoyée…)
racine.addEventListener('click', async (e) => {
  if (e.target.closest('#installer')) installer();
  if (e.target.closest('#deconnexion')) {
    await api.signOut();
    profil = null;
    location.hash = '';
    ecranConnexion();
  }
});
window.addEventListener('hashchange', afficher);

async function demarrer() {
  racine.innerHTML = '<div class="chargement" aria-label="Chargement"></div>';
  const session = await api.getSession();
  if (!session) { profil = null; ecranConnexion(); return; }
  profil = await api.getProfile(session.userId);
  if (!profil) {
    await api.signOut();
    ecranConnexion();
    toast('Profil introuvable. As-tu bien exécuté le fichier schema.sql dans Supabase ?', true);
    return;
  }
  afficher();
}

api.onRecovery(ecranNouveauMotDePasse);
demarrer();
