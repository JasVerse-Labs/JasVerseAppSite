#!/usr/bin/env node
/* Cache-busting asset versioning (Part: live cache/i18n hotfix).
 *
 * Root cause of the reported stale-mixed-release bug: /assets/css/* and
 * /assets/js/* are referenced by stable, unversioned URLs. Even with the
 * service worker's own CACHE_VERSION bumped and old caches purged on
 * activate, the browser's ordinary HTTP cache (and any CDN in front of
 * GitHub Pages) can still serve a previously cached response for that
 * same URL -- entirely independent of our service worker's cache
 * lifecycle. A network-first HTML page can therefore end up paired with
 * cache-first CSS/JS from the previous release.
 *
 * Fix: give every release its own asset identity. This script rewrites
 * every /assets/css/*.css and /assets/js/*.js reference in every HTML
 * file (and the matching fetch() calls inside assets/js/i18n.js) to
 * carry a `?v=<version>` query string, replacing any previous one. A
 * new version is therefore guaranteed to be a fresh URL everywhere:
 * browser HTTP cache, any CDN, and our own service worker cache.
 *
 * Usage: node scripts/set-asset-version.mjs <version>
 * Example: node scripts/set-asset-version.mjs 20260908g
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const VERSION = process.argv[2];

if (!VERSION || !/^[a-zA-Z0-9._-]+$/.test(VERSION)) {
  console.error("Usage: node scripts/set-asset-version.mjs <version>  (alphanumeric/./_/- only)");
  process.exit(1);
}

function listHtmlFiles(dir) {
  let out = [];
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith(".git")) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out = out.concat(listHtmlFiles(full));
    else if (extname(entry) === ".html") out.push(full);
  }
  return out;
}

/* Matches /assets/css/x.css or /assets/js/x.js, with an optional
   existing ?v=... query string, inside an href="..." or src="..." */
const ASSET_ATTR_RE = /((?:href|src)=")(\/assets\/(?:css|js)\/[A-Za-z0-9_-]+\.(?:css|js))(?:\?v=[A-Za-z0-9._-]+)?(")/g;

let filesChanged = 0;

for (const file of listHtmlFiles(ROOT)) {
  const before = readFileSync(file, "utf8");
  const after = before.replace(ASSET_ATTR_RE, (_m, pre, path, post) => `${pre}${path}?v=${VERSION}${post}`);
  if (after !== before) {
    writeFileSync(file, after);
    filesChanged++;
  }
}

/* assets/js/i18n.js fetches /assets/i18n/<code>.json at runtime with a
   plain string concatenation, not a static href/src -- version that
   fetch call directly by source edit. */
const i18nPath = join(ROOT, "assets/js/i18n.js");
const i18nBefore = readFileSync(i18nPath, "utf8");
const i18nAfter = i18nBefore
  .replace(/(var ASSET_VERSION = ")[^"]*(";)/, `$1${VERSION}$2`)
  .replace(
    /return fetch\("\/assets\/i18n\/" \+ code \+ "\.json"(?:\?v=[^"]*)?\)/,
    'return fetch("/assets/i18n/" + code + ".json?v=" + ASSET_VERSION)'
  );
if (i18nAfter !== i18nBefore) {
  writeFileSync(i18nPath, i18nAfter);
  filesChanged++;
}

/* sw.js's own ASSET_VERSION drove CACHE_VERSION and PRECACHE and, until
   this fix, had to be bumped BY HAND in sync with this script's own run
   -- exactly the kind of manual step that could silently reintroduce the
   stale-mixed-release bug this script exists to prevent (a real gap
   found while building tests/pwa-upgrade-regression.spec.js in Wave 002
   CORRECTIVE CLOSURE 002-E, Part D). Bump it here too, automatically. */
const swPath = join(ROOT, "sw.js");
const swBefore = readFileSync(swPath, "utf8");
const SW_ASSET_VERSION_RE = /(var ASSET_VERSION = ")[^"]*(";)/;
if (!SW_ASSET_VERSION_RE.test(swBefore)) {
  console.error("WARNING: sw.js's ASSET_VERSION line was not found -- CACHE_VERSION may now be out of sync.");
} else {
  const swAfter = swBefore.replace(SW_ASSET_VERSION_RE, `$1${VERSION}$2`);
  if (swAfter !== swBefore) {
    writeFileSync(swPath, swAfter);
    filesChanged++;
  }
}

console.log(`ASSET_VERSION set to "${VERSION}" -- ${filesChanged} file(s) updated.`);
