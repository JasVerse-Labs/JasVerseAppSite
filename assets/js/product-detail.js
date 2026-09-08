/* JasVerse — fills in the live status/surfaces/last_verified bits of a
   product detail page from data/public-products.json. The narrative
   content on these pages is hand-written and evidence-checked; only the
   fields that must stay in lockstep with the products list are pulled
   from data here. */
(function () {
  "use strict";

  var root = document.getElementById("product-detail-root");
  if (!root) return;
  var id = root.getAttribute("data-product-id");
  if (!id) return;

  fetch("/data/public-products.json", { cache: "no-store" })
    .then(function (r) { return r.json(); })
    .then(function (list) {
      var product = list.products.filter(function (x) { return x.id === id; })[0];
      if (!product) return;

      var surfacesMount = document.getElementById("product-surfaces");
      if (surfacesMount) {
        surfacesMount.innerHTML = product.surfaces
          ? window.JV.surfaceRow(product.surfaces)
          : '<p class="card__desc">No verified surface is publicly available yet.</p>';
      }

      var lastVerified = document.getElementById("product-last-verified");
      if (lastVerified) lastVerified.textContent = "Last verified: " + product.last_verified;
    })
    .catch(function () {});
})();
