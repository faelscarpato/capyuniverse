// Basic app-shell caching with stale-while-revalidate for assets
const CACHE_VERSION = 'capy-v1';
const CORE_CACHE = `core-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

const CORE_ASSETS = [
  './',
  './index.html',
  './cu-style.css',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './tools.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CORE_CACHE)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(k => ![CORE_CACHE, RUNTIME_CACHE].includes(k))
        .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

function isNavigationRequest(request){
  return request.mode === 'navigate' || (
    request.method === 'GET' && request.headers.get('accept')?.includes('text/html')
  );
}

const STATIC_EXT = /(\.(?:css|js|png|jpg|jpeg|webp|gif|svg|ico|woff2?|ttf|eot))$/i;

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  if (isNavigationRequest(request)) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (STATIC_EXT.test(new URL(request.url).pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Default: try network first with cache fallback
  event.respondWith(networkFirst(request));
});

async function cacheFirst(request){
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request, { ignoreVary: true });
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    return caches.match(request);
  }
}

async function networkFirst(request){
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    // Fallback to app shell
    return caches.match('./index.html');
  }
}
