/**
 * Minimal service worker for PWA installability only.
 * Do NOT cache-first HTML or navigations — that breaks Next.js in standalone
 * (stale / wrong document → 404 or blank app after install).
 */
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }
  // Always hit the network so the shell, RSC, and assets stay correct.
  event.respondWith(fetch(event.request));
});
