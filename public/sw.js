// NutriTrack Service Worker
// Cache-first for assets, network-first for navigation

const CACHE = 'nutritrack-v1';

self.addEventListener('install', e => {
  // Pre-cache the app shell
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(['./index.html']))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // Delete old caches from previous versions
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  // Skip Firebase and external requests — always go to network
  const url = new URL(e.request.url);
  if (!url.origin.includes(self.location.hostname)) return;

  if (e.request.mode === 'navigate') {
    // Navigation: network first, fall back to cached index.html for offline
    e.respondWith(
      fetch(e.request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Static assets: cache first, then network
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // Only cache successful same-origin responses
        if (res.ok && url.origin === self.location.origin) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
