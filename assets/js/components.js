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

  /* Reads a public-data field that may be either a plain (English-only)
     string, or a locale map like {"en": "...", "it": "..."} (Founder
     live-site addendum, Part 6: JSON-driven content must localize too,
     without duplicating whole datasets). Falls back to English, then to
     whatever locale is present, so a field is never rendered blank. */
  JV.localized = function (value) {
    if (value == null) return "";
    if (typeof value === "string") return value;
    var locale = (window.JVI18N && window.JVI18N.getLocale()) || "en";
    if (Object.prototype.hasOwnProperty.call(value, locale)) return value[locale];
    if (Object.prototype.hasOwnProperty.call(value, "en")) return value.en;
    var keys = Object.keys(value);
    return keys.length ? value[keys[0]] : "";
  };

  /* "Last verified: <date>" with the label translated and the date
     substituted in -- used everywhere a public data file's
     last_verified field is displayed. */
  JV.lastVerifiedText = function (dateStr) {
    var template = (window.JVI18N && window.JVI18N.t("common.lastVerified")) || "Last verified: {date}";
    return template.replace("{date}", dateStr);
  };

  function tOr(key, fallback) {
    var v = window.JVI18N && window.JVI18N.t(key);
    return v !== null && v !== undefined ? v : fallback;
  }

  JV.badge = function (status) {
    var cls = BADGE_CLASS[status] || "badge-coming";
    var label = tOr("status." + status, status);
    return '<span class="badge ' + cls + '">' + escapeHtml(label) + "</span>";
  };

  JV.surfaceRow = function (surfaces) {
    if (!surfaces) return "";
    var order = ["web", "pwa", "android", "ios", "windows", "linux", "macos"];
    var chips = order
      .filter(function (k) { return surfaces[k]; })
      .map(function (k) {
        var state = surfaces[k];
        var stateLabel = tOr("surface.state." + state, state);
        return (
          '<span class="surface-chip" data-state="' + escapeHtml(state) + '">' +
          k.toUpperCase() + " &middot; " + escapeHtml(stateLabel) +
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
        '<a href="' + escapeHtml(product.public_url) + '" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">' +
        escapeHtml(tOr("products.card.open", "Open")) + " " + escapeHtml(product.name) + "</a> ";
    }
    linkHtml +=
      '<a href="/products/' + escapeHtml(product.id) + '/" class="btn btn-primary">' +
      escapeHtml(tOr("products.card.details", "Details")) + "</a>";

    card.innerHTML =
      '<h3 class="card__title">' + escapeHtml(product.name) + " " + JV.badge(product.status) + "</h3>" +
      '<p class="card__desc">' + escapeHtml(JV.localized(product.summary)) + "</p>" +
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
      '<div class="status-row__meta">' + escapeHtml(JV.lastVerifiedText(item.last_verified || tOr("common.unknown", "unknown"))) + "</div>";
    return row;
  };
})(window.JV);
