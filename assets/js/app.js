/* JasVerse — small shared page behaviors (footer year, share). */
(function () {
  "use strict";

  document.querySelectorAll("[data-current-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  document.querySelectorAll("[data-share]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var url = window.location.href;
      if (navigator.share) {
        navigator.share({ title: document.title, url: url }).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function () {
          var original = btn.textContent;
          btn.textContent = "Link copied";
          setTimeout(function () { btn.textContent = original; }, 1800);
        });
      }
    });
  });

  /* External links: safe rel (Part 28) */
  document.querySelectorAll('a[target="_blank"]').forEach(function (a) {
    var rel = (a.getAttribute("rel") || "").split(/\s+/);
    ["noopener", "noreferrer"].forEach(function (token) {
      if (rel.indexOf(token) === -1) rel.push(token);
    });
    a.setAttribute("rel", rel.filter(Boolean).join(" "));
  });
})();
