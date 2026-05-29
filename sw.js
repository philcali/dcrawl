const CACHE = "dcrawl-v1";
const ASSETS = [
  ".",
  "index.html",
  "css/styles.css",
  "js/classes.js",
  "js/dungeon.js",
  "js/entities.js",
  "js/state.js",
  "js/combat.js",
  "js/renderer.js",
  "js/ui.js",
  "js/controls.js",
  "js/audio.js",
  "js/app.js",
  "icons/icon-192.svg",
  "icons/icon-512.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
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
  e.respondWith(
    caches.match(e.request).then((r) => r || fetch(e.request).then((resp) => {
      if (resp && resp.status === 200) {
        const clone = resp.clone();
        caches.open(CACHE).then((c) => c.put(e.request, clone));
      }
      return resp;
    }).catch(() => caches.match(e.request)))
  );
});
