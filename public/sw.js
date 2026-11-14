// Bumper la version purge tous les anciens caches à l'activation.
// v8 : suppression du cache API v7 qui contenait des données de compte.
const CACHE_VERSION = "v8";
const STATIC_CACHE = `mywatchlist-static-${CACHE_VERSION}`;
const API_CACHE = `mywatchlist-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `mywatchlist-image-${CACHE_VERSION}`;
const CURRENT_CACHES = new Set([STATIC_CACHE, API_CACHE, IMAGE_CACHE]);

const STATIC_MAX_ENTRIES = 200;
const API_MAX_ENTRIES = 100;
const IMAGE_MAX_ENTRIES = 80;

// Seules les routes proxy TMDB publiques (sans cookie, identiques pour tous) sont cachées.
// Tout ce qui dépend du compte (/api/auth, /api/watchlist, /api/friends, ...) passe par le réseau.
const PUBLIC_API_PATTERN =
  /^\/api\/(?:discover(?:\/tv)?|search|(?:movies|tv)\/\d+(?:\/(?:credits|watch-providers))?|person\/\d+(?:\/movie-credits)?)$/;

const PUBLIC_ASSET_PATTERN = /\.(?:css|js|png|ico|svg|jpe?g|webp)$/;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => !CURRENT_CACHES.has(key)).map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // Cache Storage ne gère que GET ; les mutations vont directement au réseau.
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    // 1) Chunks Next hashés (immuables) → cache-first
    if (url.pathname.startsWith("/_next/static/")) {
      event.respondWith(cacheFirst(event, STATIC_CACHE, STATIC_MAX_ENTRIES));
      return;
    }

    // 2) Proxy TMDB public → network-first avec fallback cache (hors-ligne)
    if (PUBLIC_API_PATTERN.test(url.pathname)) {
      event.respondWith(networkFirst(event, API_CACHE, API_MAX_ENTRIES));
      return;
    }

    // 3) Fichiers de /public (non hashés, ex. logos) → stale-while-revalidate
    //    pour que les mises à jour soient prises en compte sans bumper la version.
    if (
      !url.pathname.startsWith("/api/") &&
      !url.pathname.startsWith("/_next/") &&
      PUBLIC_ASSET_PATTERN.test(url.pathname)
    ) {
      event.respondWith(staleWhileRevalidate(event, STATIC_CACHE, STATIC_MAX_ENTRIES));
      return;
    }

    // Navigations, RSC, API privée : comportement réseau par défaut du navigateur.
    return;
  }

  // 4) Affiches TMDB → stale-while-revalidate. Requête en mode CORS (image.tmdb.org
  //    renvoie Access-Control-Allow-Origin: *) : une réponse opaque ne serait jamais cachée.
  if (url.hostname === "image.tmdb.org") {
    event.respondWith(
      staleWhileRevalidate(event, IMAGE_CACHE, IMAGE_MAX_ENTRIES, () =>
        fetch(request.url, { mode: "cors", credentials: "omit" }).catch(() => fetch(request))
      )
    );
  }
});

async function cacheFirst(event, cacheName, maxEntries) {
  const cached = await caches.match(event.request, { cacheName });
  if (cached) return cached;

  const response = await fetch(event.request);
  if (response.ok) {
    event.waitUntil(putInCache(cacheName, event.request, response.clone(), maxEntries));
  }
  return response;
}

async function networkFirst(event, cacheName, maxEntries) {
  try {
    const response = await fetch(event.request);
    if (response.ok) {
      event.waitUntil(putInCache(cacheName, event.request, response.clone(), maxEntries));
    }
    return response;
  } catch (error) {
    const cached = await caches.match(event.request, { cacheName });
    if (cached) return cached;
    throw error;
  }
}

async function staleWhileRevalidate(
  event,
  cacheName,
  maxEntries,
  fetchFromNetwork = () => fetch(event.request)
) {
  const cached = await caches.match(event.request, { cacheName });

  const network = fetchFromNetwork().then((response) => {
    if (response.ok) {
      event.waitUntil(putInCache(cacheName, event.request, response.clone(), maxEntries));
    }
    return response;
  });

  if (cached) {
    event.waitUntil(network.catch(() => undefined));
    return cached;
  }
  return network;
}

async function putInCache(cacheName, request, response, maxEntries) {
  try {
    const cache = await caches.open(cacheName);
    await cache.put(request, response);
    await enforceCacheLimit(cache, maxEntries);
  } catch (error) {
    console.warn("[sw] Écriture en cache impossible", error);
  }
}

// Supprime les entrées les plus anciennes (ordre d'insertion) au-delà de maxEntries.
async function enforceCacheLimit(cache, maxEntries) {
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;

  const toDelete = keys.slice(0, keys.length - maxEntries);
  await Promise.all(toDelete.map((key) => cache.delete(key)));
}
