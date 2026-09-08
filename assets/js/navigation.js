/* JasVerse — shared global navigation. Rendered once from here so nav
   markup lives in a single place instead of being copy-pasted across
   every HTML page (Part 41: avoid manual content debt). */
(function () {
  "use strict";

  var LINKS = [
    { href: "/", label: "Home" },
    { href: "/products/", label: "Products" },
    { href: "/lab/", label: "Lab" },
    { href: "/ecosystem/", label: "Ecosystem" },
    { href: "/live/", label: "Live" },
  ];

  function normalizePath(path) {
    if (path.length > 1 && path.endsWith("index.html")) {
      path = path.slice(0, -"index.html".length);
    }
    if (path.length > 1 && path.endsWith("/") === false && path.indexOf(".") === -1) {
      path = path + "/";
    }
    return path;
  }

  function render() {
    var root = document.getElementById("jv-nav-root");
    if (!root) return;

    var currentPath = normalizePath(window.location.pathname);

    var nav = document.createElement("nav");
    nav.className = "jv-nav";
    nav.setAttribute("aria-label", "Navigazione principale JasVerse");

    var inner = document.createElement("div");
    inner.className = "jv-nav__inner";

    var brand = document.createElement("a");
    brand.className = "jv-nav__brand";
    brand.href = "/";
    brand.innerHTML =
      '<img src="/Stemma%20JasVerse.png" alt="" width="28" height="28">' +
      '<span class="brand-text">JASVERSE&reg;</span>';
    inner.appendChild(brand);

    LINKS.forEach(function (link) {
      var a = document.createElement("a");
      a.className = "jv-nav__link";
      a.href = link.href;
      a.textContent = link.label;
      if (normalizePath(link.href) === currentPath) {
        a.setAttribute("aria-current", "page");
      }
      inner.appendChild(a);
    });

    nav.appendChild(inner);
    root.replaceWith(nav);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
