const CACHE_NAME = 'cinebrest-v2';
const urlsToCache = [
  '/static/images/favicon.png',
  '/static/images/nocontent.png',
  '/static/images/icon-192.png',
  '/static/images/icon-512.png'
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

// Stratégie: Network First, Cache Fallback SAUF pour les pages HTML
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Ne PAS cacher les pages HTML (contiennent des infos de session)
  const isHTMLPage = event.request.destination === 'document' ||
    event.request.headers.get('accept')?.includes('text/html');

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone la réponse
        const responseToCache = response.clone();

        // Met en cache UNIQUEMENT les ressources statiques (images, CSS, JS)
        if (event.request.method === 'GET' && !isHTMLPage) {
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
        }

        return response;
      })
      .catch(() => {
        // Si le réseau échoue, cherche dans le cache (sauf pour HTML)
        if (!isHTMLPage) {
          return caches.match(event.request);
        }
        // Pour HTML, ne pas servir de cache
        return new Response('Vous êtes hors ligne', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain' })
        });
      })
  );
});
