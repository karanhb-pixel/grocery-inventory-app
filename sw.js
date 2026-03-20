const CACHE_NAME = 'grocery-tracker-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/src/app.js',
  '/src/core/state.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
