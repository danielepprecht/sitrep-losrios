/**
 * service-worker.js
 *
 * Estrategia de cache para SITREP Los Ríos:
 *   - Precaching del shell (HTML, manifest, íconos)
 *   - Network-first para CDN externos (Leaflet, html2pdf, fuentes)
 *   - Stale-while-revalidate para tiles del mapa OSM
 *   - Bypass total para nominatim.openstreetmap.org y photon.komoot.io
 *     (las consultas de geocodificación deben ser siempre frescas)
 *
 * Versión: incrementar al hacer cambios significativos para invalidar cache.
 */

const VERSION = 'sitrep-losrios-v1';
const SHELL_CACHE = `${VERSION}-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;

const SHELL_FILES = [
  './',
  './SITREP_Maquina_LosRios.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(cache =>
      cache.addAll(SHELL_FILES).catch(err => console.warn('SW: precache parcial:', err))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo manejar GET
  if (request.method !== 'GET') return;

  // Bypass: geocodificadores siempre directos
  if (url.hostname.includes('nominatim.openstreetmap.org') ||
      url.hostname.includes('photon.komoot.io')) {
    return;
  }

  // Tiles del mapa: stale-while-revalidate
  if (url.hostname.includes('tile.openstreetmap.org')) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // CDN externos: cache-first con fallback a red
  if (url.hostname.includes('unpkg.com') ||
      url.hostname.includes('cdnjs.cloudflare.com') ||
      url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Shell de la app: cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request));
    return;
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return cached || Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => cached);
  return cached || fetchPromise;
}
