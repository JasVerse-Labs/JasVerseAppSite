/* JasVerse — renders /live/ : public-safe ecosystem status, not an
   internal monitoring dashboard. Data only, never simulated real-time.
   Re-renders on locale change. */
(function () {
  "use strict";

  function tOr(key, fallback) {
    var v = window.JVI18N && window.JVI18N.t(key);
    return v !== null && v !== undefined ? v : fallback;
  }

  function toStatusItem(product) {
    return {
      name: product.name,
      status: product.status,
      online: product.status === "LIVE" || product.status === "BETA",
      last_verified: product.last_verified,
    };
  }

  var lastResults = null;

  function render(results) {
    lastResults = results;
    var products = results[0];
    var changelog = results[1];

    var list = document.getElementById("live-status-list");
    if (list) {
      list.innerHTML = "";
      var items = [{ name: "JASVERSE", status: "LIVE", online: true, last_verified: products.last_verified }]
        .concat(products.products.map(toStatusItem));
      items.forEach(function (item) {
        list.appendChild(window.JV.statusRow(item));
      });
    }

    var changeMount = document.getElementById("live-latest-change");
    if (changeMount && changelog.entries.length) {
      var latest = changelog.entries[0];
      changeMount.innerHTML =
        '<div class="changelog-date">' + window.JV.escapeHtml(latest.date) + "</div>" +
        "<strong>" + window.JV.escapeHtml(window.JV.localized(latest.title)) + "</strong>" +
        "<p>" + window.JV.escapeHtml(window.JV.localized(latest.summary)) + "</p>";
    }

    var verifiedMount = document.getElementById("live-last-verified");
    if (verifiedMount) verifiedMount.textContent = window.JV.lastVerifiedText(products.last_verified);
  }

  Promise.all([
    fetch("/data/public-products.json", { cache: "no-store" }).then(function (r) { return r.json(); }),
    fetch("/data/public-changelog.json", { cache: "no-store" }).then(function (r) { return r.json(); }),
  ])
    .then(render)
    .catch(function () {
      var list = document.getElementById("live-status-list");
      if (list) list.textContent = tOr("live.loadError", "Status data could not be loaded right now.");
    });

  if (window.JVI18N) {
    window.JVI18N.onChange(function () {
      if (lastResults) render(lastResults);
    });
  }
})();
