// Cache complet de l'application : elle fonctionne sans internet après la première ouverture.
// Changer le numéro de version ci-dessous force la mise à jour chez tous les utilisateurs.
var CACHE = "numero-au-tableau-v1";
var ASSETS = [
  "./",
  "index.html",
  "app.css",
  "app.js",
  "pwa.js",
  "manifest.webmanifest",
  "fonts/bricolage-700.woff2",
  "fonts/bricolage-800.woff2",
  "fonts/cairo-arabic.woff2",
  "fonts/cairo-latin.woff2",
  "fonts/inter-latin.woff2",
  "icons/icon-32.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
      if (hit) return hit;
      return fetch(e.request).catch(function () {
        if (e.request.mode === "navigate") return caches.match("index.html");
      });
    })
  );
});
