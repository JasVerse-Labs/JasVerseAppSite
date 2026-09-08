/* JasVerse — homepage preview sections (live products teaser + latest
   public change). Full lists live on /products/ and /live/. Re-renders
   on locale change. */
(function () {
  "use strict";

  var lastProducts = null;
  var lastChangelog = null;

  function renderProducts(data) {
    lastProducts = data;
    var mount = document.getElementById("home-products-preview");
    if (!mount) return;
    mount.innerHTML = "";
    data.products.slice(0, 3).forEach(function (p) {
      mount.appendChild(window.JV.productCard(p));
    });
  }

  function renderChangelog(data) {
    lastChangelog = data;
    var mount = document.getElementById("home-latest-change");
    if (!mount || !data.entries.length) return;
    var latest = data.entries[0];
    mount.innerHTML =
      '<div class="changelog-date">' + window.JV.escapeHtml(latest.date) + "</div>" +
      "<strong>" + window.JV.escapeHtml(window.JV.localized(latest.title)) + "</strong>" +
      "<p>" + window.JV.escapeHtml(window.JV.localized(latest.summary)) + "</p>";
  }

  fetch("/data/public-products.json", { cache: "no-store" })
    .then(function (r) { return r.json(); })
    .then(renderProducts)
    .catch(function () {});

  fetch("/data/public-changelog.json", { cache: "no-store" })
    .then(function (r) { return r.json(); })
    .then(renderChangelog)
    .catch(function () {});

  if (window.JVI18N) {
    window.JVI18N.onChange(function () {
      if (lastProducts) renderProducts(lastProducts);
      if (lastChangelog) renderChangelog(lastChangelog);
    });
  }
})();
