const STATIC_CACHE = "mywatchlist-static-v3";
const API_CACHE = "mywatchlist-api-v3";
const IMAGE_CACHE = "mywatchlist-image-v3";

self.addEventListener("install", (event) => {
  // On peut pré-cacher des ressources ici si besoin plus tard
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(
            (key) =>
              key !== STATIC_CACHE &&
              key !== API_CACHE &&
              key !== IMAGE_CACHE
          )
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1) Assets Next et statiques (shell de l'app) → cache-first
  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/_next/") ||
      url.pathname.endsWith(".css") ||
      url.pathname.endsWith(".js") ||
      url.pathname.endsWith(".png") ||
      url.pathname.endsWith(".ico") ||
      url.pathname.endsWith(".svg") ||
      url.pathname.endsWith(".jpg") ||
      url.pathname.endsWith(".jpeg") ||
      url.pathname.endsWith(".webp"))
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 2) API de ton app (proxy TMDB) → network-first avec fallback cache
  if (url.origin === self.location.origin && url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // 3) Images TMDB → stale-while-revalidate + limite d'entrées
  if (url.hostname === "image.tmdb.org") {
    event.respondWith(staleWhileRevalidateWithLimit(request, IMAGE_CACHE, 80));
    return;
  }

  // Fallback par défaut : comportement réseau direct
  event.respondWith(fetch(request));
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function staleWhileRevalidateWithLimit(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone()).then(() => {
          enforceCacheLimit(cache, maxEntries);
        });
      }
      return response;
    })
    .catch(() => {
      // En cas d'erreur réseau, on retourne quand même le cache si possible
      return cached || Promise.reject();
    });

  return cached || networkPromise;
}

async function enforceCacheLimit(cache, maxEntries) {
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;

  const toDelete = keys.slice(0, keys.length - maxEntries);
  await Promise.all(toDelete.map((request) => cache.delete(request)));
}

