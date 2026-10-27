// Service worker : permet d'installer l'app et de l'ouvrir même avec une connexion faible.
// Pense à changer le numéro de version à chaque mise à jour de l'app.
const VERSION = 'bootyflow-v28';

const FICHIERS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css?v=28',
  './js/config.js',
  './js/data.js',
  './js/ui.js',
  './js/eleve.js',
  './js/coach.js',
  './js/chat.js',
  './js/videotheque.js',
  './js/programmes.js',
  './js/vocal.js',
  './js/bilans.js',
  './js/macros.js',
  './js/photos.js',
  './js/etat.js',
  './js/rappels.js',
  './js/compression.js',
  './js/app.js?v=28',
  './img/banniere.jpg',
  './img/coach.jpg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) =>
    cache.addAll(FICHIERS.map((f) => new Request(f, { cache: 'reload' })))));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cles) =>
      Promise.all(cles.filter((c) => c !== VERSION).map((c) => caches.delete(c)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // On ne met jamais en cache les données (Supabase) ni les requêtes d'envoi.
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Le numéro de version publié doit toujours venir du site, jamais du cache
  if (url.pathname.endsWith('/version.json')) return;

  // Réseau d'abord (pour avoir toujours la dernière version), cache si hors ligne.
  event.respondWith(
    // cache: 'no-cache' : on redemande toujours au serveur s'il y a une nouvelle version
    fetch(event.request, { cache: 'no-cache' })
      .then((reponse) => {
        const copie = reponse.clone();
        caches.open(VERSION).then((cache) => cache.put(event.request, copie));
        return reponse;
      })
      .catch(() => caches.match(event.request).then((r) => r || caches.match('./index.html')))
  );
});

// Notifications de rappel (bilan du week-end) envoyées par la fonction Supabase rappels-bilans
self.addEventListener('push', (event) => {
  let donnees = {};
  try { donnees = event.data ? event.data.json() : {}; } catch (e) { donnees = { corps: event.data && event.data.text() }; }
  event.waitUntil(self.registration.showNotification(donnees.titre || 'Booty Flow', {
    body: donnees.corps || '',
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
    tag: 'rappel-bilan',
    data: { url: donnees.url || '#/accueil' }
  }));
});

// Un toucher sur la notification ouvre l'app sur le bon écran
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const cible = new URL(`./${event.notification.data?.url || ''}`, self.registration.scope).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((fenetres) => {
    const ouverte = fenetres.find((c) => c.url.startsWith(self.registration.scope));
    if (ouverte) return ouverte.navigate(cible).then((c) => (c || ouverte).focus()).catch(() => ouverte.focus());
    return self.clients.openWindow(cible);
  }));
});
