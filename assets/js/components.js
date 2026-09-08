/* JasVerse — shared render helpers for public projection data.
   Pure functions: given a public-safe data object, return DOM/HTML.
   Never fabricate a state that isn't in the data (Part 44). */
window.JV = window.JV || {};

(function (JV) {
  "use strict";

  var BADGE_CLASS = {
    LIVE: "badge-live",
    BETA: "badge-beta",
    LAB: "badge-lab",
    RESEARCH: "badge-research",
    COMING: "badge-coming",
    PAUSED: "badge-paused",
  };

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = String(str == null ? "" : str);
    return div.innerHTML;
  }

  JV.escapeHtml = escapeHtml;

  JV.badge = function (status) {
    var cls = BADGE_CLASS[status] || "badge-coming";
    return '<span class="badge ' + cls + '">' + escapeHtml(status) + "</span>";
  };

  JV.surfaceRow = function (surfaces) {
    if (!surfaces) return "";
    var order = ["web", "pwa", "android", "ios", "windows", "linux", "macos"];
    var chips = order
      .filter(function (k) { return surfaces[k]; })
      .map(function (k) {
        var state = surfaces[k];
        return (
          '<span class="surface-chip" data-state="' + escapeHtml(state) + '">' +
          k.toUpperCase() + " &middot; " + escapeHtml(state) +
          "</span>"
        );
      });
    return '<div class="surface-row">' + chips.join("") + "</div>";
  };

  /* Renders one product card. `product` must match
     data/public-products.json's allowlisted schema -- see
     scripts/validate-public-data.mjs for the enforced shape. */
  JV.productCard = function (product) {
    var card = document.createElement("div");
    card.className = "card";

    var linkHtml = "";
    if (product.public_url && product.surfaces && product.surfaces.web === "AVAILABLE") {
      linkHtml =
        '<a href="' + escapeHtml(product.public_url) + '" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">Open ' +
        escapeHtml(product.name) + "</a>";
    }

    card.innerHTML =
      '<h3 class="card__title">' + escapeHtml(product.name) + " " + JV.badge(product.status) + "</h3>" +
      '<p class="card__desc">' + escapeHtml(product.summary) + "</p>" +
      JV.surfaceRow(product.surfaces) +
      linkHtml;

    return card;
  };

  JV.statusRow = function (item) {
    var row = document.createElement("div");
    row.className = "status-row";
    var dotClass = item.online ? "on" : (item.status === "LAB" ? "lab" : "off");
    row.innerHTML =
      '<div><span class="status-dot ' + dotClass + '"></span><span class="status-row__name">' +
      escapeHtml(item.name) + "</span></div>" +
      '<div>' + JV.badge(item.status) + '</div>' +
      '<div class="status-row__meta">Last verified: ' + escapeHtml(item.last_verified || "unknown") + "</div>";
    return row;
  };
})(window.JV);
