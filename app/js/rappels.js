// RAPPELS : notifications sur le téléphone de l'élève (bilan du week-end à envoyer, bilan en retard,
// réponses de la coach : voir notifications-eleves.sql)
// et sur les appareils de la coach (message, bilan, vidéo à corriger, charges : voir notifications-coach.sql).
// L'élève active les rappels une fois ; le téléphone donne une adresse de notification que l'on
// enregistre dans Supabase (table abonnements_push). L'envoi est fait par la fonction rappels-bilans.
import { api, MODE } from './data.js';
import { VAPID_PUBLIC_KEY } from './config.js';
import { icone, toast, pendant } from './ui.js';

const estIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const estInstallee = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const pushPossible = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

function cleEnOctets(texte) {
  const b64 = texte.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (texte.length % 4)) % 4);
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

async function abonnementActuel() {
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

// 'installer' (iPhone : l'app doit être sur l'écran d'accueil), 'impossible', 'refuse', 'actif', 'inactif'
export async function etatRappels() {
  if (!pushPossible()) return estIOS && !estInstallee() ? 'installer' : 'impossible';
  if (Notification.permission === 'denied') return 'refuse';
  if (Notification.permission === 'granted' && await abonnementActuel().catch(() => null)) return 'actif';
  return 'inactif';
}

export async function activerRappels(profil) {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error("Tu n'as pas autorisé les notifications.");
  const reg = await navigator.serviceWorker.ready;
  const abonnement = (await reg.pushManager.getSubscription())
    || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: cleEnOctets(VAPID_PUBLIC_KEY) });
  await api.enregistrerAbonnement(profil.id, abonnement.toJSON());
}

// À chaque ouverture : si les rappels sont autorisés, on renvoie l'adresse (elle peut changer avec le temps)
export async function synchroniserRappels(profil) {
  try {
    if (!pushPossible() || Notification.permission !== 'granted') return;
    const abonnement = await abonnementActuel();
    if (abonnement) await api.enregistrerAbonnement(profil.id, abonnement.toJSON());
  } catch (e) { /* hors ligne : on réessaiera */ }
}

// Carte affichée sur l'accueil (élève) ou le tableau de bord (coach) tant que les notifications ne sont pas actives
export async function carteRappels(conteneur, profil) {
  if (!conteneur) return;
  const etat = await etatRappels();
  if (etat === 'actif' || etat === 'impossible') { conteneur.innerHTML = ''; return; }
  const coach = profil.role === 'coach';
  const textes = coach ? {
    inactif: ['Sois prévenue sur cet appareil à chaque nouveau message, bilan, vidéo à corriger ou suivi de charges. Active-les sur chaque appareil (téléphone, Mac…).',
      `<button class="bouton-principal compact" id="activer-rappels">${icone('cloche', 16)}ACTIVER LES NOTIFICATIONS</button>`],
    installer: ["Pour recevoir les notifications sur ton iPhone, installe d'abord l'app : bouton Partager de Safari, puis « Sur l'écran d'accueil ». Ouvre ensuite l'app depuis son icône.", ''],
    refuse: ['Les notifications sont bloquées sur cet appareil. Autorise-les pour Booty Flow dans les réglages (téléphone : Réglages › Notifications ; Mac : Réglages Système › Notifications, ou les réglages du site dans ton navigateur).', '']
  } : {
    inactif: ['Sois prévenue quand ta coach te répond (message, correction, retour sur ton bilan) et reçois un rappel le dimanche soir si ton bilan n\'est pas encore envoyé.',
      `<button class="bouton-principal compact" id="activer-rappels">${icone('cloche', 16)}ACTIVER LES NOTIFICATIONS</button>`],
    installer: ["Pour recevoir les notifications sur ton iPhone, installe d'abord l'app : bouton Partager de Safari, puis « Sur l'écran d'accueil ». Ouvre ensuite l'app depuis son icône.", ''],
    refuse: ['Les notifications sont bloquées. Pour les recevoir : Réglages du téléphone › Notifications › Booty Flow › Autoriser.', '']
  };
  const [texte, bouton] = textes[etat];
  conteneur.innerHTML = `<section class="carte carte-rappels">
    <div class="surtitre-carte">NOTIFICATIONS</div>
    <p class="petit">${texte}</p>${bouton}
  </section>`;
  conteneur.querySelector('#activer-rappels')?.addEventListener('click', async (e) => {
    try {
      await pendant(e.currentTarget, 'Activation…', () => activerRappels(profil));
      toast(MODE === 'demo' ? 'Notifications activées (démo : aucune notification réelle).'
        : coach ? 'Notifications activées sur cet appareil !' : 'Notifications activées ! Tu seras prévenue quand ta coach te répond.');
      conteneur.innerHTML = '';
    } catch (err) {
      toast(err.message, true);
      carteRappels(conteneur, profil);
    }
  });
}
