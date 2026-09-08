/* JasVerse — renders Lab experiments from data/public-lab.json. Used on
   both /lab/index.html (a short preview) and /lab/experiments.html (the
   full list) via the same data source and the [data-lab-mode] attribute. */
(function () {
  "use strict";

  var EXPERIMENT_BADGE = {
    IDEA: "badge-coming",
    RESEARCH: "badge-research",
    EXPERIMENT: "badge-lab",
    VALIDATED: "badge-live",
    INTEGRATED: "badge-live",
    ARCHIVED: "badge-coming",
  };

  function card(exp) {
    var el = document.createElement("div");
    el.className = "card";
    var badgeClass = EXPERIMENT_BADGE[exp.status] || "badge-coming";
    el.innerHTML =
      '<h3 class="card__title">' + window.JV.escapeHtml(exp.title) +
      ' <span class="badge ' + badgeClass + '">' + window.JV.escapeHtml(exp.status) + "</span></h3>" +
      '<p class="card__desc">' + window.JV.escapeHtml(exp.summary) + "</p>";
    return el;
  }

  var mount = document.getElementById("lab-experiments-grid");
  if (!mount) return;

  var mode = mount.getAttribute("data-lab-mode") || "full";

  fetch("/data/public-lab.json", { cache: "no-store" })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var list = data.experiments;
      if (mode === "preview") list = list.slice(0, 2);
      list.forEach(function (exp) { mount.appendChild(card(exp)); });
    })
    .catch(function () {
      mount.textContent = "Lab data could not be loaded right now.";
    });
})();
