// Basic service worker for offline support of previously visited pages/assets.
// It precaches the app shell and then serves cached responses when offline.

const CACHE_NAME = 'rv-placements-shell-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Network-first for API calls that use IndexedDB (so IndexedDB stays primary source),
// cache-first for static assets so app can boot offline.
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // For API calls, let the app's IndexedDB logic decide; we just fall back to cache if available when offline.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request)
      )
    );
    return;
  }

  // For static assets and navigation, use cache-first.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => cached);
    })
  );
});

