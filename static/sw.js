const CACHE_NAME = 'cinebrest-v1';
const urlsToCache = [
  '/',
  '/static/images/favicon.png',
  '/static/images/nocontent.png'
];

// Installation du Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Cache ouvert');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activation du Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Stratégie: Network First, Cache Fallback
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone la réponse
        const responseToCache = response.clone();

        // Met en cache uniquement les GET requests
        if (event.request.method === 'GET') {
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
        }

        return response;
      })
      .catch(() => {
        // Si le réseau échoue, cherche dans le cache
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            // Si pas dans le cache, retourne une page offline
            if (event.request.destination === 'document') {
              return caches.match('/');
            }
          });
      })
  );
});
