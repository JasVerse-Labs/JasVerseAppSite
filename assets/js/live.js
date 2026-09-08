/* JasVerse — renders /live/ : public-safe ecosystem status, not an
   internal monitoring dashboard. Data only, never simulated real-time. */
(function () {
  "use strict";

  function toStatusItem(product) {
    return {
      name: product.name,
      status: product.status,
      online: product.status === "LIVE" || product.status === "BETA",
      last_verified: product.last_verified,
    };
  }

  Promise.all([
    fetch("/data/public-products.json", { cache: "no-store" }).then(function (r) { return r.json(); }),
    fetch("/data/public-changelog.json", { cache: "no-store" }).then(function (r) { return r.json(); }),
  ])
    .then(function (results) {
      var products = results[0];
      var changelog = results[1];

      var list = document.getElementById("live-status-list");
      if (list) {
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
          "<strong>" + window.JV.escapeHtml(latest.title) + "</strong>" +
          "<p>" + window.JV.escapeHtml(latest.summary) + "</p>";
      }

      var verifiedMount = document.getElementById("live-last-verified");
      if (verifiedMount) verifiedMount.textContent = "Last verified: " + products.last_verified;
    })
    .catch(function () {
      var list = document.getElementById("live-status-list");
      if (list) list.textContent = "Status data could not be loaded right now.";
    });
})();
