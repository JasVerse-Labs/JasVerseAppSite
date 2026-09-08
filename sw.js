/* JasVerse service worker.
   Strategy (Part 23): HTML and public JSON are NETWORK FIRST with a safe
   cached fallback (so product/lab/live status never gets stuck stale
   indefinitely); static hashed-by-convention assets (css/js/images) are
   CACHE FIRST. Bump CACHE_VERSION on any asset change to invalidate. */
"use strict";

/* ASSET_VERSION must match scripts/set-asset-version.mjs's last run --
   bump both together. This is what actually fixes the stale-mixed-release
   bug: cache-first URLs now change identity on every release, so a
   browser/CDN HTTP cache entry for the OLD url can never be served under
   the NEW release's html, independent of this cache store's own
   lifecycle. CACHE_VERSION bump (below) additionally purges this
   service worker's own Cache API storage on activate. */
var ASSET_VERSION = "20260908h";
var CACHE_VERSION = "jv-cache-v3-" + ASSET_VERSION;
var OFFLINE_URL = "/offline.html";

var PRECACHE = [
  "/",
  "/offline.html",
  "/assets/css/tokens.css?v=" + ASSET_VERSION,
  "/assets/css/base.css?v=" + ASSET_VERSION,
  "/assets/css/layout.css?v=" + ASSET_VERSION,
  "/assets/css/components.css?v=" + ASSET_VERSION,
  "/assets/css/pages.css?v=" + ASSET_VERSION,
  "/assets/css/mobile.css?v=" + ASSET_VERSION,
  "/assets/js/app.js?v=" + ASSET_VERSION,
  "/assets/js/navigation.js?v=" + ASSET_VERSION,
  "/assets/js/components.js?v=" + ASSET_VERSION,
  "/assets/js/i18n.js?v=" + ASSET_VERSION,
  "/assets/js/product-detail.js?v=" + ASSET_VERSION,
  "/assets/js/pwa.js?v=" + ASSET_VERSION,
  "/assets/i18n/en.json?v=" + ASSET_VERSION,
  "/assets/i18n/it.json?v=" + ASSET_VERSION,
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
    url.pathname.startsWith("/assets/i18n/") ||
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
