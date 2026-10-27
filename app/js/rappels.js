// RAPPELS : notifications sur le téléphone de l'élève (bilan du week-end à envoyer, bilan en retard).
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
    if (profil.role === 'coach' || !pushPossible() || Notification.permission !== 'granted') return;
    const abonnement = await abonnementActuel();
    if (abonnement) await api.enregistrerAbonnement(profil.id, abonnement.toJSON());
  } catch (e) { /* hors ligne : on réessaiera */ }
}

// Carte affichée sur l'accueil de l'élève tant que les rappels ne sont pas actifs
export async function carteRappels(conteneur, profil) {
  const etat = await etatRappels();
  if (etat === 'actif' || etat === 'impossible') { conteneur.innerHTML = ''; return; }
  const textes = {
    inactif: ['Reçois un rappel sur ton téléphone le dimanche soir si ton bilan n\'est pas encore envoyé.',
      `<button class="bouton-principal compact" id="activer-rappels">${icone('cloche', 16)}ACTIVER LES RAPPELS</button>`],
    installer: ["Pour recevoir les rappels de bilan sur ton iPhone, installe d'abord l'app : bouton Partager de Safari, puis « Sur l'écran d'accueil ». Ouvre ensuite l'app depuis son icône.", ''],
    refuse: ['Les notifications sont bloquées. Pour recevoir les rappels : Réglages du téléphone › Notifications › Booty Flow › Autoriser.', '']
  };
  const [texte, bouton] = textes[etat];
  conteneur.innerHTML = `<section class="carte carte-rappels">
    <div class="surtitre-carte">RAPPELS DE BILAN</div>
    <p class="petit">${texte}</p>${bouton}
  </section>`;
  conteneur.querySelector('#activer-rappels')?.addEventListener('click', async (e) => {
    try {
      await pendant(e.currentTarget, 'Activation…', () => activerRappels(profil));
      toast(MODE === 'demo' ? 'Rappels activés (démo : aucune notification réelle).' : 'Rappels activés ! Tu seras prévenue pour tes bilans.');
      conteneur.innerHTML = '';
    } catch (err) {
      toast(err.message, true);
      carteRappels(conteneur, profil);
    }
  });
}
