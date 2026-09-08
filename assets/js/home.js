/* JasVerse — homepage preview sections (live products teaser + latest
   public change). Full lists live on /products/ and /live/. */
(function () {
  "use strict";

  fetch("/data/public-products.json", { cache: "no-store" })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var mount = document.getElementById("home-products-preview");
      if (!mount) return;
      data.products.slice(0, 3).forEach(function (p) {
        mount.appendChild(window.JV.productCard(p));
      });
    })
    .catch(function () {});

  fetch("/data/public-changelog.json", { cache: "no-store" })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var mount = document.getElementById("home-latest-change");
      if (!mount || !data.entries.length) return;
      var latest = data.entries[0];
      mount.innerHTML =
        '<div class="changelog-date">' + window.JV.escapeHtml(latest.date) + "</div>" +
        "<strong>" + window.JV.escapeHtml(latest.title) + "</strong>" +
        "<p>" + window.JV.escapeHtml(latest.summary) + "</p>";
    })
    .catch(function () {});
})();
