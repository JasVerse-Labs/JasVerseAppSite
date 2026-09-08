/* JasVerse — renders Lab experiments from data/public-lab.json. Used on
   both /lab/index.html (a short preview) and /lab/experiments.html (the
   full list) via the same data source and the [data-lab-mode] attribute.
   Re-renders on locale change (title/summary may be locale maps). */
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

  function tOr(key, fallback) {
    var v = window.JVI18N && window.JVI18N.t(key);
    return v !== null && v !== undefined ? v : fallback;
  }

  function card(exp) {
    var el = document.createElement("div");
    el.className = "card";
    var badgeClass = EXPERIMENT_BADGE[exp.status] || "badge-coming";
    var statusLabel = tOr("experiment.status." + exp.status, exp.status);
    el.innerHTML =
      '<h3 class="card__title">' + window.JV.escapeHtml(window.JV.localized(exp.title)) +
      ' <span class="badge ' + badgeClass + '">' + window.JV.escapeHtml(statusLabel) + "</span></h3>" +
      '<p class="card__desc">' + window.JV.escapeHtml(window.JV.localized(exp.summary)) + "</p>";
    return el;
  }

  var mount = document.getElementById("lab-experiments-grid");
  if (!mount) return;

  var mode = mount.getAttribute("data-lab-mode") || "full";
  var lastData = null;

  function render(data) {
    lastData = data;
    mount.innerHTML = "";
    var list = data.experiments;
    if (mode === "preview") list = list.slice(0, 2);
    list.forEach(function (exp) { mount.appendChild(card(exp)); });
  }

  fetch("/data/public-lab.json", { cache: "no-store" })
    .then(function (r) { return r.json(); })
    .then(render)
    .catch(function () {
      mount.textContent = tOr("lab.loadError", "Lab data could not be loaded right now.");
    });

  if (window.JVI18N) {
    window.JVI18N.onChange(function () {
      if (lastData) render(lastData);
    });
  }
})();
