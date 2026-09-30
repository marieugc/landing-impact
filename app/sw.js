// Service worker : permet d'installer l'app et de l'ouvrir même avec une connexion faible.
// Pense à changer le numéro de version à chaque mise à jour de l'app.
const VERSION = 'bootyflow-v1';

const FICHIERS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './js/config.js',
  './js/data.js',
  './js/ui.js',
  './js/eleve.js',
  './js/coach.js',
  './js/app.js',
  './img/logo.jpg',
  './img/coach.jpg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(FICHIERS)));
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

  // Réseau d'abord (pour avoir toujours la dernière version), cache si hors ligne.
  event.respondWith(
    fetch(event.request)
      .then((reponse) => {
        const copie = reponse.clone();
        caches.open(VERSION).then((cache) => cache.put(event.request, copie));
        return reponse;
      })
      .catch(() => caches.match(event.request).then((r) => r || caches.match('./index.html')))
  );
});
