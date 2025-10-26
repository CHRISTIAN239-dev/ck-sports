const CACHE_NAME = 'ck-sports-v1';
const OFFLINE_URL = '/offline.html';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/manifest.json',
  '/offline.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Try network first, then fallback to cache, then offline page
  event.respondWith(
    fetch(event.request).then((response) => {
      // Put a copy in the cache for future
      const responseClone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone)).catch(()=>{});
      return response;
    }).catch(() => caches.match(event.request).then((r) => r || caches.match(OFFLINE_URL)))
  );
});
