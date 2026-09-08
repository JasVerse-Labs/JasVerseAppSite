/* JasVerse — renders /products/ from data/public-products.json.
   Never hardcodes product state in HTML (Part 41). */
(function () {
  "use strict";

  function render(list) {
    var mount = document.getElementById("products-grid");
    if (!mount) return;
    mount.innerHTML = "";
    list.products.forEach(function (product) {
      mount.appendChild(window.JV.productCard(product));
    });

    var meta = document.getElementById("products-last-verified");
    if (meta) meta.textContent = "Last verified: " + list.last_verified;
  }

  function renderError() {
    var mount = document.getElementById("products-grid");
    if (mount) {
      mount.innerHTML =
        '<p class="card__desc">Product data could not be loaded right now. Please refresh, or visit again shortly.</p>';
    }
  }

  fetch("/data/public-products.json", { cache: "no-store" })
    .then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(render)
    .catch(renderError);
})();
