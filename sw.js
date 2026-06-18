// Cloudy Skies - offline service worker
const CACHE = "cloudy-skies-v12";
const ASSETS = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icon-192.png",
  "icon-512.png",
  "apple-touch-icon.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  // Network-first for the game itself (page / script / manifest), so updates
  // always show up when online; fall back to the cached copy only when offline.
  const isCode =
    req.mode === "navigate" ||
    req.destination === "document" ||
    url.pathname.endsWith("/") ||
    url.pathname.endsWith("index.html") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".webmanifest");

  if (isCode) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then((hit) => hit || caches.match("index.html"))
        )
    );
    return;
  }

  // Cache-first for static art (icons) - these rarely change.
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
});
