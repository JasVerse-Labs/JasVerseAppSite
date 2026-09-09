// @ts-check
/* PWA upgrade-regression test (Wave 002 CORRECTIVE CLOSURE 002-E, Part D).
 *
 * This exact scenario was run once, by hand, during the live-cache/i18n
 * hotfix (see runtime/CHANGE_FEED.md's EVT-013 in JasVerse-Operations)
 * but was never committed as a repeatable test -- only proven ad hoc in
 * a session sandbox. This commits that same validated approach as a
 * permanent, repeatable CI gate.
 *
 * One change from how it was originally run: instead of pinning a
 * specific historical commit SHA as "the old release" (which would rot
 * as an assertion target the moment that commit is many releases in the
 * past), this test reproduces the MECHANISM itself -- the same
 * `scripts/set-asset-version.mjs` version bump every real release runs.
 * It builds two copies of the CURRENT checkout, versions them
 * differently ("old" and "new"), and proves a browser upgrading from one
 * to the other never serves a mix of the two.
 *
 * Root cause under test (see scripts/set-asset-version.mjs's own header
 * comment): unversioned /assets/css|js/* URLs let a browser's ordinary
 * HTTP cache serve a stale response for the same URL across releases,
 * independent of the service worker's own Cache API lifecycle.
 */

const { test, expect, chromium } = require("@playwright/test");
const { execFileSync } = require("node:child_process");
const { mkdtempSync, cpSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const http = require("node:http");
const fs = require("node:fs");

const ROOT = join(__dirname, "..");
const IGNORE = new Set([".git", "node_modules", "tests", "playwright.config.js", "package.json", "package-lock.json"]);

function buildRelease(version) {
  const dir = mkdtempSync(join(tmpdir(), `jasverse-release-${version}-`));
  for (const entry of fs.readdirSync(ROOT)) {
    if (IGNORE.has(entry)) continue;
    cpSync(join(ROOT, entry), join(dir, entry), { recursive: true });
  }
  // Run the COPY's own script, not the real repo's -- the script resolves
  // its root from its own file location (dirname of import.meta.url), not
  // from `cwd`, so pointing this at the real repo's script file would
  // silently mutate the real checkout instead of the disposable copy.
  execFileSync(process.execPath, [join(dir, "scripts/set-asset-version.mjs"), version], { cwd: dir, stdio: "pipe" });
  return dir;
}

const MIME = {
  ".html": "text/html", ".css": "text/css", ".js": "application/javascript",
  ".json": "application/json", ".png": "image/png", ".webmanifest": "application/manifest+json",
  ".xml": "application/xml", ".txt": "text/plain",
};

function serve(rootDir, port = 0) {
  const server = http.createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split("?")[0]);
    if (urlPath === "/") urlPath = "/index.html";
    const filePath = join(rootDir, urlPath);
    if (!filePath.startsWith(rootDir)) { res.writeHead(403); res.end(); return; }
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end(); return; }
      const ext = filePath.slice(filePath.lastIndexOf("."));
      res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
      res.end(data);
    });
  });
  return new Promise((resolve) => server.listen(port, "localhost", () => resolve(server)));
}

test("upgrading from an old release to a new one never mixes assets", async () => {
  const oldDir = buildRelease("test-old-001");
  const newDir = buildRelease("test-new-002");
  let server = await serve(oldDir);
  const port = server.address().port;
  const origin = `http://localhost:${port}`;

  const userDataDir = mkdtempSync(join(tmpdir(), "jasverse-profile-"));
  const launchOptions = { headless: true };
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE) launchOptions.executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  const context = await chromium.launchPersistentContext(userDataDir, launchOptions);
  try {
    const page = await context.newPage();
    const consoleErrors = [];
    page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });

    await page.goto(origin + "/", { waitUntil: "networkidle" });
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 15_000 });

    const oldCacheKeys = await page.evaluate(() => caches.keys());
    expect(oldCacheKeys.some((k) => k.includes("test-old-001"))).toBe(true);

    // Swap the server to the new release, on the SAME origin/port, then
    // reload the SAME persistent profile -- this is the actual upgrade
    // scenario a real deployed user experiences.
    await new Promise((resolve) => server.close(resolve));
    server = await serve(newDir, port);

    await page.reload({ waitUntil: "networkidle" });
    // Force an immediate update check rather than waiting on the
    // browser's own implicit once-per-navigation check timing, then wait
    // on the actual lifecycle EVENT (the new worker reaching "activated")
    // instead of blind reload-polling -- the activate handler's cache
    // purge has already run by the time that state is observable, so
    // this is a deterministic signal rather than a timing guess. Blind
    // reload-polling passed locally but flaked in CI (slower cold-start
    // Chromium), which is exactly the kind of environment-dependent
    // timing this rewrite removes.
    await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return;
      await reg.update();
      await new Promise((resolve) => {
        const candidate = reg.installing || reg.waiting;
        if (!candidate) {
          resolve();
          return;
        }
        if (candidate.state === "activated") {
          resolve();
          return;
        }
        candidate.addEventListener("statechange", function onChange() {
          if (candidate.state === "activated") {
            candidate.removeEventListener("statechange", onChange);
            resolve();
          }
        });
      });
    });
    await page.reload({ waitUntil: "networkidle" });

    const newCacheKeys = await page.evaluate(() => caches.keys());
    const staleKeys = newCacheKeys.filter((k) => k.includes("test-old-001"));
    expect(staleKeys, `stale cache key(s) survived the upgrade: ${staleKeys.join(", ")}`).toEqual([]);
    expect(newCacheKeys.some((k) => k.includes("test-new-002"))).toBe(true);

    const assetRefs = await page.evaluate(() =>
      [...document.querySelectorAll('link[rel="stylesheet"], script[src]')]
        .map((el) => el.getAttribute("href") || el.getAttribute("src"))
        .filter(Boolean)
    );
    const mixedReleaseAssets = assetRefs.filter((ref) => ref.includes("v=test-old-001"));
    expect(mixedReleaseAssets, `DOM still references old-release asset URLs: ${mixedReleaseAssets.join(", ")}`).toEqual([]);
    expect(assetRefs.every((ref) => ref.includes("v=test-new-002"))).toBe(true);

    expect(consoleErrors, `console errors during upgrade: ${consoleErrors.join(" | ")}`).toEqual([]);
  } finally {
    await context.close();
    await new Promise((resolve) => server.close(resolve));
    rmSync(oldDir, { recursive: true, force: true });
    rmSync(newDir, { recursive: true, force: true });
    rmSync(userDataDir, { recursive: true, force: true });
  }
});
