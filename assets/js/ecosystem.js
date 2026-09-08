/* JasVerse — renders /ecosystem/ from data/public-ecosystem.json and
   data/public-products.json. */
(function () {
  "use strict";

  Promise.all([
    fetch("/data/public-ecosystem.json", { cache: "no-store" }).then(function (r) { return r.json(); }),
    fetch("/data/public-products.json", { cache: "no-store" }).then(function (r) { return r.json(); }),
  ])
    .then(function (results) {
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
          .map(function (c) { return "<li>" + window.JV.escapeHtml(c) + "</li>"; })
          .join("");
      }

      var principleMount = document.getElementById("ecosystem-principle");
      if (principleMount) principleMount.textContent = ecosystem.principle;
    })
    .catch(function () {
      var mount = document.getElementById("ecosystem-map");
      if (mount) mount.textContent = "Ecosystem data could not be loaded right now.";
    });
})();
