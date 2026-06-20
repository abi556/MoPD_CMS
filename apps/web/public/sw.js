/*
 * MoPD CMS service worker.
 *
 * Strategy:
 *  - Navigations (HTML pages): network-first, fall back to the cached page,
 *    then to the offline fallback. Keeps content fresh online, usable offline.
 *  - Static assets (_next/static, images, fonts): stale-while-revalidate.
 *  - API requests and authenticated areas: always network, never cached
 *    (sensitive session data must not be persisted on the device).
 *
 * Bump CACHE_VERSION to invalidate all caches on the next activation.
 */
const CACHE_VERSION = "v3";
const PRECACHE = `mopd-precache-${CACHE_VERSION}`;
const RUNTIME_PAGES = `mopd-pages-${CACHE_VERSION}`;
const RUNTIME_ASSETS = `mopd-assets-${CACHE_VERSION}`;

const OFFLINE_URL = "/offline.html";

const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/mopd_fav.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  const keep = new Set([PRECACHE, RUNTIME_PAGES, RUNTIME_ASSETS]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => !keep.has(key)).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

function isPrivatePath(pathname) {
  return (
    pathname.startsWith("/api/") ||
    /^\/(en|am)\/dashboard/.test(pathname) ||
    /^\/(en|am)\/auth/.test(pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET; let the browser deal with POST/PATCH/etc.
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // Same-origin only. Never intercept the API or authenticated areas.
  if (url.origin !== self.location.origin || isPrivatePath(url.pathname)) {
    return;
  }

  // HTML navigations — network-first with offline fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(RUNTIME_PAGES);
          cache.put(request, fresh.clone());
          return fresh;
        } catch {
          const cached = await caches.match(request);
          if (cached) return cached;
          const offline = await caches.match(OFFLINE_URL);
          return (
            offline ||
            new Response("Offline", {
              status: 503,
              headers: { "Content-Type": "text/plain" },
            })
          );
        }
      })(),
    );
    return;
  }

  // Static assets — stale-while-revalidate.
  const dest = request.destination;
  if (
    url.pathname.startsWith("/_next/static") ||
    url.pathname.startsWith("/icons/") ||
    dest === "style" ||
    dest === "script" ||
    dest === "font" ||
    dest === "image"
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME_ASSETS);
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => undefined);
        return cached || (await network) || Response.error();
      })(),
    );
  }
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
