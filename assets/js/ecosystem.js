/* JasVerse — renders /ecosystem/ from data/public-ecosystem.json and
   data/public-products.json. Re-renders on locale change. */
(function () {
  "use strict";

  function tOr(key, fallback) {
    var v = window.JVI18N && window.JVI18N.t(key);
    return v !== null && v !== undefined ? v : fallback;
  }

  var lastResults = null;

  function render(results) {
    lastResults = results;
    var ecosystem = results[0];
    var products = results[1].products;
    var mount = document.getElementById("ecosystem-map");
    if (!mount) return;

    var branchHtml = products
      .map(function (p) {
        return '<div class="ecosystem-node">' + window.JV.escapeHtml(p.name) + "</div>";
      })
      .join("");

    mount.innerHTML =
      '<div class="ecosystem-node root">' + window.JV.escapeHtml(ecosystem.root) + "</div>" +
      '<div class="ecosystem-connector"></div>' +
      '<div class="ecosystem-branch">' + branchHtml + "</div>";

    var capMount = document.getElementById("ecosystem-capabilities");
    if (capMount) {
      capMount.innerHTML = ecosystem.shared_capabilities
        .map(function (c) { return "<li>" + window.JV.escapeHtml(window.JV.localized(c)) + "</li>"; })
        .join("");
    }

    var principleMount = document.getElementById("ecosystem-principle");
    if (principleMount) principleMount.textContent = window.JV.localized(ecosystem.principle);
  }

  Promise.all([
    fetch("/data/public-ecosystem.json", { cache: "no-store" }).then(function (r) { return r.json(); }),
    fetch("/data/public-products.json", { cache: "no-store" }).then(function (r) { return r.json(); }),
  ])
    .then(render)
    .catch(function () {
      var mount = document.getElementById("ecosystem-map");
      if (mount) mount.textContent = tOr("ecosystem.loadError", "Ecosystem data could not be loaded right now.");
    });

  if (window.JVI18N) {
    window.JVI18N.onChange(function () {
      if (lastResults) render(lastResults);
    });
  }
})();
