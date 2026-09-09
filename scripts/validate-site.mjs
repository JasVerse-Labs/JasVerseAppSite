#!/usr/bin/env node
/* Site validation gate (Part 35). Zero external dependencies. */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
let errors = [];
function fail(msg) { errors.push(msg); }

const REQUIRED_PAGES = [
  "index.html", "privacy.html", "terms.html", "404.html", "offline.html",
  "products/index.html",
  "lab/index.html", "lab/research.html", "lab/experiments.html", "lab/evidence.html", "lab/method.html",
  "ecosystem/index.html", "live/index.html",
];

for (const page of REQUIRED_PAGES) {
  if (!existsSync(join(ROOT, page))) fail(`required page missing: ${page}`);
}

/* manifest parses */
let manifest;
try {
  manifest = JSON.parse(readFileSync(join(ROOT, "manifest.webmanifest"), "utf8"));
  if (!manifest.icons || manifest.icons.length === 0) fail("manifest.webmanifest has no icons");
} catch (e) {
  fail(`manifest.webmanifest invalid: ${e.message}`);
}

/* sitemap paths map to actual pages */
const sitemapXml = readFileSync(join(ROOT, "sitemap.xml"), "utf8");
const locs = [...sitemapXml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
if (locs.length === 0) fail("sitemap.xml has no <loc> entries");
for (const loc of locs) {
  const path = loc.replace(/^https:\/\/jasverse\.com\/?/, "");
  const target = path === "" ? "index.html" : path;
  const full = join(ROOT, target);
  if (!existsSync(full)) fail(`sitemap.xml references missing page: ${loc}`);
}

/* all public JSON parses (also covered by validate-public-data.mjs, kept
   here so validate-site.mjs alone still catches a broken JSON file) */
const dataDir = join(ROOT, "data");
for (const f of readdirSync(dataDir).filter((f) => f.endsWith(".json"))) {
  try {
    JSON.parse(readFileSync(join(dataDir, f), "utf8"));
  } catch (e) {
    fail(`data/${f} invalid JSON: ${e.message}`);
  }
}

/* walk every HTML file: internal links/assets resolve, no http:// resource
   on this https site, target=_blank uses safe rel, required metadata
   present */
function listHtmlFiles(dir) {
  let out = [];
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith(".git") || entry === "node_modules" || entry === "test-results") continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out = out.concat(listHtmlFiles(full));
    else if (extname(entry) === ".html") out.push(full);
  }
  return out;
}

function resolveLocalPath(fromFile, href) {
  if (/^(https?:)?\/\//.test(href) || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("#")) {
    return null; // external/anchor -- not a local resolve target
  }
  const cleanHref = href.split("#")[0].split("?")[0];
  if (cleanHref === "") return null;
  if (cleanHref.startsWith("/")) return join(ROOT, decodeURIComponent(cleanHref));
  return join(dirname(fromFile), decodeURIComponent(cleanHref));
}

const htmlFiles = listHtmlFiles(ROOT);
for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  const rel = file.replace(ROOT + "/", "");

  if (!/<title>.*<\/title>/s.test(html)) fail(`${rel}: missing <title>`);
  if (!/<meta name="description"/.test(html)) fail(`${rel}: missing meta description`);
  if (!/<html lang="/.test(html)) fail(`${rel}: missing html lang attribute`);

  if (/http:\/\/(?!localhost)/.test(html)) {
    fail(`${rel}: contains an insecure http:// resource reference`);
  }

  const hrefMatches = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
  for (const href of hrefMatches) {
    const localPath = resolveLocalPath(file, href);
    if (localPath && !existsSync(localPath)) {
      fail(`${rel}: broken local reference "${href}"`);
    }
  }

  const blankLinks = [...html.matchAll(/<a\s+[^>]*target="_blank"[^>]*>/g)];
  for (const tag of blankLinks) {
    if (!/rel="[^"]*noopener[^"]*"/.test(tag[0])) {
      fail(`${rel}: target="_blank" link missing rel="noopener" -- "${tag[0].slice(0, 60)}..."`);
    }
  }
}

if (errors.length > 0) {
  console.error("SITE_VALIDATION: FAIL\n" + errors.map((e) => "  - " + e).join("\n"));
  process.exit(1);
}

console.log(`SITE_VALIDATION: PASS (${htmlFiles.length} HTML files, ${locs.length} sitemap entries checked)`);
