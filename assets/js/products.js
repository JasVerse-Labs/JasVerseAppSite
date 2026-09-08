/* JasVerse — renders /products/ from data/public-products.json.
   Never hardcodes product state in HTML (Part 41). Re-renders on locale
   change so a language switch doesn't require a reload. */
(function () {
  "use strict";

  var lastList = null;

  function render(list) {
    lastList = list;
    var mount = document.getElementById("products-grid");
    if (!mount) return;
    mount.innerHTML = "";
    list.products.forEach(function (product) {
      mount.appendChild(window.JV.productCard(product));
    });

    var meta = document.getElementById("products-last-verified");
    if (meta) meta.textContent = window.JV.lastVerifiedText(list.last_verified);
  }

  function renderError() {
    var mount = document.getElementById("products-grid");
    if (mount) {
      var msg = (window.JVI18N && window.JVI18N.t("products.loadError")) ||
        "Product data could not be loaded right now. Please refresh, or visit again shortly.";
      mount.innerHTML = '<p class="card__desc">' + window.JV.escapeHtml(msg) + "</p>";
    }
  }

  fetch("/data/public-products.json", { cache: "no-store" })
    .then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(render)
    .catch(renderError);

  if (window.JVI18N) {
    window.JVI18N.onChange(function () {
      if (lastList) render(lastList);
    });
  }
})();
