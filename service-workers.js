/**
 * IJSO Master Flashcards — service worker
 *
 * Strategy: network-first for the app shell (HTML/CSS/JS), so a new
 * deployment is picked up immediately instead of being masked by a stale
 * cache. Falls back to the cache when offline. Bump CACHE_VERSION whenever
 * you ship changes to force old caches to be discarded.
 */

var CACHE_VERSION = "ijso-flashcards-v2";
var APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./flashcards.js",
  "./manifest.json"
];

self.addEventListener("install", function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function (cache) {
      return cache.addAll(APP_SHELL).catch(function () {
        /* ignore individual asset failures so install doesn't hard-fail */
      });
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) { return key !== CACHE_VERSION; })
          .map(function (key) { return caches.delete(key); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;

  // Network-first for same-origin app-shell files.
  var url = new URL(req.url);
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(req)
        .then(function (res) {
          var copy = res.clone();
          caches.open(CACHE_VERSION).then(function (cache) { cache.put(req, copy); });
          return res;
        })
        .catch(function () {
          return caches.match(req).then(function (cached) {
            return cached || caches.match("./index.html");
          });
        })
    );
    return;
  }

  // Cache-first for cross-origin assets (e.g. Google Fonts).
  event.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE_VERSION).then(function (cache) { cache.put(req, copy); });
        return res;
      });
    })
  );
});
