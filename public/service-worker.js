/**
 * ח. סבן חומרי בניין בע"מ — PWA Service Worker
 * תמיכה מלאה במצב אופליין לנהגים (חכמת ועלי) ושמירת אריחי מפת Leaflet במטמון (Cache)
 */

const CACHE_NAME = 'saban-logistics-v1';
const MAP_TILES_CACHE = 'map-tiles-cache-v1';

// Static assets to precache
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('✅ Saban PWA Service Worker: Pre-caching static assets');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Pre-cache partial notice:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME && name !== MAP_TILES_CACHE) {
            console.log('🧹 Purging old cache:', name);
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // 1. קריטי לנהגים בשטח: זיהוי בקשות לאריחי מפה OpenStreetMap ושמירתן במטמון נפרד
  if (url.includes('tile.openstreetmap.org') || url.includes('openstreetmap')) {
    event.respondWith(
      caches.open(MAP_TILES_CACHE).then((cache) => {
        return cache.match(event.request).then((response) => {
          // אם האריח קיים במטמון - החזר אותו מיד (אופליין מהיר!)
          if (response) {
            return response;
          }
          // אם לא - משוך מהרשת ושמור במטמון לשימוש הבא
          return fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(event.request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => {
              // במקרה שאין רשת כלל, נחזיר תגובה ריקה או מטמון קודם
              return new Response('', { status: 408, headers: { 'Content-Type': 'image/png' } });
            });
        });
      })
    );
    return;
  }

  // 2. עבור קבצים סטטיים של האפליקציה: Cache first, network fallback
  if (event.request.method === 'GET' && (url.includes('.js') || url.includes('.css') || url.includes('fonts.'))) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((res) => {
          if (res && res.status === 200) {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, resClone));
          }
          return res;
        });
      })
    );
    return;
  }

  // Default network fetch
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
