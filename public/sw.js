// Service worker básico para cache offline (PWA)
const CACHE_NAME = 'barberzap-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/favicon.ico',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
