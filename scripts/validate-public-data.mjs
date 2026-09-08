#!/usr/bin/env node
/* Publication firewall (Part 16). Zero external dependencies.
 * Validates every data/public-*.json file against an allowlisted schema
 * and rejects anything that looks like a secret, token, or private
 * infrastructure identifier. Exits non-zero on any violation. */

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");

const ALLOWED_PRODUCT_FIELDS = new Set([
  "id", "name", "status", "summary", "public_url", "surfaces", "last_verified",
]);
const ALLOWED_STATUS = new Set(["LIVE", "BETA", "LAB", "RESEARCH", "COMING", "PAUSED"]);
const ALLOWED_SURFACE_KEYS = new Set(["web", "pwa", "android", "ios", "windows", "linux", "macos"]);
const ALLOWED_SURFACE_STATE = new Set(["AVAILABLE", "BETA", "PLANNED", "NOT_AVAILABLE"]);

const ALLOWED_EXPERIMENT_FIELDS = new Set(["id", "title", "status", "summary", "last_verified"]);
const ALLOWED_EXPERIMENT_STATUS = new Set([
  "IDEA", "RESEARCH", "EXPERIMENT", "VALIDATED", "INTEGRATED", "ARCHIVED",
]);

const ALLOWED_CHANGELOG_FIELDS = new Set(["date", "title", "summary"]);

/* Locales this site actually ships translations for -- must track
   assets/js/i18n.js's LANGUAGES list. A translatable text field may be
   either a plain (English-only) string, or a locale map keyed only from
   this set, so a public data file can never carry a JSON key the site
   has no locale for. */
const KNOWN_LOCALES = new Set(["en", "it", "es", "fr", "pt-BR", "ru", "zh", "hi", "ar", "bn"]);

function validateLocalizedField(file, value, path) {
  if (value == null || typeof value === "string") return;
  if (typeof value !== "object" || Array.isArray(value)) {
    fail(file, `field "${path}" must be a string or a {locale: string} map`);
    return;
  }
  if (!Object.prototype.hasOwnProperty.call(value, "en")) {
    fail(file, `locale map "${path}" is missing a required "en" fallback`);
  }
  for (const [locale, text] of Object.entries(value)) {
    if (!KNOWN_LOCALES.has(locale)) {
      fail(file, `locale map "${path}" has unknown locale key "${locale}"`);
    }
    if (typeof text !== "string") {
      fail(file, `locale map "${path}.${locale}" must be a string`);
    }
  }
}

const ALLOWED_ECOSYSTEM_FIELDS = new Set([
  "schema_version", "last_verified", "root", "products", "shared_capabilities", "principle",
]);

const SECRET_PATTERNS = [
  /sk-[a-zA-Z0-9]{16,}/, // generic API-key shape
  /ghp_[a-zA-Z0-9]{20,}/, // GitHub PAT
  /AKIA[0-9A-Z]{12,}/, // AWS access key
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\b[0-9a-f]{32}\b/i, // bare 32-hex (often an account/db/worker id)
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i, // UUID (often a private resource id)
];

const FORBIDDEN_FIELD_NAMES = [
  "secret", "token", "account_id", "database_id", "worker_id",
  "private_repo", "internal_path", "credential", "api_key", "password",
];

let errors = [];

function fail(file, message) {
  errors.push(`${file}: ${message}`);
}

function scanForSecrets(file, value, path) {
  if (typeof value === "string") {
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(value)) {
        fail(file, `field "${path}" matches a secret/private-identifier pattern (${pattern})`);
      }
    }
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      if (FORBIDDEN_FIELD_NAMES.some((f) => k.toLowerCase().includes(f))) {
        fail(file, `forbidden field name "${path}.${k}" -- looks like a private identifier or credential`);
      }
      scanForSecrets(file, v, `${path}.${k}`);
    }
  }
}

function validateProduct(file, product, idx) {
  const label = `products[${idx}] (${product.id || "?"})`;
  for (const key of Object.keys(product)) {
    if (!ALLOWED_PRODUCT_FIELDS.has(key)) {
      fail(file, `${label}: unknown/unapproved field "${key}"`);
    }
  }
  if (!product.id || !product.name || !product.summary) {
    fail(file, `${label}: missing required field (id/name/summary)`);
  }
  validateLocalizedField(file, product.summary, `${label}.summary`);
  if (!ALLOWED_STATUS.has(product.status)) {
    fail(file, `${label}: status "${product.status}" is not an allowed publication state`);
  }
  if (product.public_url && !/^https:\/\//.test(product.public_url)) {
    fail(file, `${label}: public_url must be https://`);
  }
  if (product.surfaces) {
    for (const [k, v] of Object.entries(product.surfaces)) {
      if (!ALLOWED_SURFACE_KEYS.has(k)) fail(file, `${label}: unknown surface key "${k}"`);
      if (!ALLOWED_SURFACE_STATE.has(v)) fail(file, `${label}: surface "${k}" has invalid state "${v}"`);
    }
  }
  if (!product.last_verified) fail(file, `${label}: missing last_verified`);
}

function validateProductsFile(file, data) {
  if (!Array.isArray(data.products)) return fail(file, "missing products[] array");
  data.products.forEach((p, i) => validateProduct(file, p, i));
}

function validateLabFile(file, data) {
  if (!Array.isArray(data.experiments)) return fail(file, "missing experiments[] array");
  data.experiments.forEach((exp, i) => {
    const label = `experiments[${i}] (${exp.id || "?"})`;
    for (const key of Object.keys(exp)) {
      if (!ALLOWED_EXPERIMENT_FIELDS.has(key)) fail(file, `${label}: unknown field "${key}"`);
    }
    if (!ALLOWED_EXPERIMENT_STATUS.has(exp.status)) {
      fail(file, `${label}: status "${exp.status}" is not an allowed experiment state`);
    }
    validateLocalizedField(file, exp.title, `${label}.title`);
    validateLocalizedField(file, exp.summary, `${label}.summary`);
  });
}

function validateChangelogFile(file, data) {
  if (!Array.isArray(data.entries)) return fail(file, "missing entries[] array");
  data.entries.forEach((entry, i) => {
    const label = `entries[${i}]`;
    for (const key of Object.keys(entry)) {
      if (!ALLOWED_CHANGELOG_FIELDS.has(key)) fail(file, `${label}: unknown field "${key}"`);
    }
    validateLocalizedField(file, entry.title, `${label}.title`);
    validateLocalizedField(file, entry.summary, `${label}.summary`);
  });
}

function validateEcosystemFile(file, data) {
  for (const key of Object.keys(data)) {
    if (!ALLOWED_ECOSYSTEM_FIELDS.has(key)) fail(file, `unknown field "${key}"`);
  }
  validateLocalizedField(file, data.principle, "principle");
  if (Array.isArray(data.shared_capabilities)) {
    data.shared_capabilities.forEach((c, i) => validateLocalizedField(file, c, `shared_capabilities[${i}]`));
  }
}

function main() {
  const files = readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
  if (files.length === 0) {
    console.error("PUBLICATION_FIREWALL: FAIL -- no data/*.json files found");
    process.exit(1);
  }

  for (const file of files) {
    const full = join(DATA_DIR, file);
    let data;
    try {
      data = JSON.parse(readFileSync(full, "utf8"));
    } catch (e) {
      fail(file, `invalid JSON: ${e.message}`);
      continue;
    }

    scanForSecrets(file, data, "$");

    if (file === "public-products.json") validateProductsFile(file, data);
    else if (file === "public-lab.json") validateLabFile(file, data);
    else if (file === "public-changelog.json") validateChangelogFile(file, data);
    else if (file === "public-ecosystem.json") validateEcosystemFile(file, data);
    else fail(file, "unrecognized public data file -- add explicit validation before publishing it");
  }

  if (errors.length > 0) {
    console.error("PUBLICATION_FIREWALL: FAIL\n" + errors.map((e) => "  - " + e).join("\n"));
    process.exit(1);
  }

  console.log(`PUBLICATION_FIREWALL: PASS (${files.length} public data file(s) validated)`);
}

main();
