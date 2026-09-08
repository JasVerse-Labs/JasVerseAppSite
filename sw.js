/* JasVerse service worker.
   Strategy (Part 23): HTML and public JSON are NETWORK FIRST with a safe
   cached fallback (so product/lab/live status never gets stuck stale
   indefinitely); static hashed-by-convention assets (css/js/images) are
   CACHE FIRST. Bump CACHE_VERSION on any asset change to invalidate. */
"use strict";

var CACHE_VERSION = "jv-cache-v1";
var OFFLINE_URL = "/offline.html";

var PRECACHE = [
  "/",
  "/offline.html",
  "/assets/css/tokens.css",
  "/assets/css/base.css",
  "/assets/css/layout.css",
  "/assets/css/components.css",
  "/assets/css/pages.css",
  "/assets/css/mobile.css",
  "/assets/js/app.js",
  "/assets/js/navigation.js",
  "/assets/js/components.js",
  "/assets/js/pwa.js",
  "/Stemma%20JasVerse.png",
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function (cache) {
      return cache.addAll(PRECACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) { return key !== CACHE_VERSION; })
          .map(function (key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/assets/css/") ||
    url.pathname.startsWith("/assets/js/") ||
    /\.(png|jpg|jpeg|svg|webp|avif|ico)$/i.test(url.pathname)
  );
}

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET") return;

  var url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(function (cached) {
        return (
          cached ||
          fetch(request).then(function (response) {
            var copy = response.clone();
            caches.open(CACHE_VERSION).then(function (cache) { cache.put(request, copy); });
            return response;
          })
        );
      })
    );
    return;
  }

  /* HTML navigation and public JSON: network-first, cache/offline fallback */
  event.respondWith(
    fetch(request)
      .then(function (response) {
        var copy = response.clone();
        caches.open(CACHE_VERSION).then(function (cache) { cache.put(request, copy); });
        return response;
      })
      .catch(function () {
        return caches.match(request).then(function (cached) {
          if (cached) return cached;
          if (request.mode === "navigate") return caches.match(OFFLINE_URL);
          return Response.error();
        });
      })
  );
});
