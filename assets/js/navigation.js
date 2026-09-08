/* JasVerse — shared global navigation. Rendered once from here so nav
   markup lives in a single place instead of being copy-pasted across
   every HTML page (Part 41: avoid manual content debt). Also owns the
   global language selector (Founder live-site addendum). */
(function () {
  "use strict";

  var LINKS = [
    { href: "/", key: "nav.home", label: "Home" },
    { href: "/products/", key: "nav.products", label: "Products" },
    { href: "/lab/", key: "nav.lab", label: "Lab" },
    { href: "/ecosystem/", key: "nav.ecosystem", label: "Ecosystem" },
    { href: "/live/", key: "nav.live", label: "Live" },
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

  function buildLangSelector() {
    var i18n = window.JVI18N;
    var wrap = document.createElement("div");
    wrap.className = "lang-selector";

    var current = i18n ? i18n.getLocale() : "en";
    var langs = i18n ? i18n.LANGUAGES : [{ code: "en", native: "English", flag: "🇬🇧" }];
    var byCode = {};
    langs.forEach(function (l) { byCode[l.code] = l; });

    var trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "lang-selector__trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("data-i18n-aria-label", "lang.selector.label");
    trigger.setAttribute("aria-label", (i18n && i18n.t("lang.selector.label")) || "Select language");

    function renderTrigger() {
      var lang = byCode[i18n ? i18n.getLocale() : current] || langs[0];
      trigger.innerHTML =
        '<span class="lang-selector__flag" aria-hidden="true">' + lang.flag + "</span>" +
        '<span class="lang-selector__code">' + lang.code.split("-")[0] + "</span>" +
        '<span class="lang-selector__caret" aria-hidden="true">▾</span>';
    }
    renderTrigger();

    var menu = document.createElement("ul");
    menu.className = "lang-selector__menu";
    menu.setAttribute("role", "listbox");
    menu.hidden = true;

    langs.forEach(function (lang) {
      var li = document.createElement("li");
      var opt = document.createElement("button");
      opt.type = "button";
      opt.className = "lang-selector__option";
      opt.setAttribute("role", "option");
      opt.setAttribute("aria-selected", String(lang.code === (i18n ? i18n.getLocale() : current)));
      opt.innerHTML =
        '<span class="lang-selector__flag" aria-hidden="true">' + lang.flag + "</span>" +
        "<span>" + lang.native + "</span>";
      opt.addEventListener("click", function () {
        if (i18n) i18n.setLocale(lang.code);
        closeMenu();
      });
      li.appendChild(opt);
      menu.appendChild(li);
    });

    function openMenu() {
      menu.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
      document.addEventListener("click", onDocClick, true);
      document.addEventListener("keydown", onKeydown, true);
    }
    function closeMenu() {
      menu.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
      document.removeEventListener("click", onDocClick, true);
      document.removeEventListener("keydown", onKeydown, true);
    }
    function onDocClick(e) {
      if (!wrap.contains(e.target)) closeMenu();
    }
    function onKeydown(e) {
      if (e.key === "Escape") {
        closeMenu();
        trigger.focus();
      }
    }
    trigger.addEventListener("click", function () {
      if (menu.hidden) openMenu(); else closeMenu();
    });

    if (i18n) {
      i18n.onChange(function () {
        renderTrigger();
        menu.querySelectorAll(".lang-selector__option").forEach(function (opt, idx) {
          opt.setAttribute("aria-selected", String(langs[idx].code === i18n.getLocale()));
        });
      });
    }

    wrap.appendChild(trigger);
    wrap.appendChild(menu);
    return wrap;
  }

  function render() {
    var root = document.getElementById("jv-nav-root");
    if (!root) return;

    var currentPath = normalizePath(window.location.pathname);

    var nav = document.createElement("nav");
    nav.className = "jv-nav";
    nav.setAttribute("aria-label", "JasVerse main navigation");

    var inner = document.createElement("div");
    inner.className = "jv-nav__inner";

    var brand = document.createElement("a");
    brand.className = "jv-nav__brand";
    brand.href = "/";
    brand.innerHTML =
      '<img src="/Stemma%20JasVerse.png" alt="" width="28" height="28">' +
      '<span class="brand-text">JASVERSE&reg;</span>';
    inner.appendChild(brand);

    var linksWrap = document.createElement("div");
    linksWrap.className = "jv-nav__links";

    LINKS.forEach(function (link) {
      var a = document.createElement("a");
      a.className = "jv-nav__link";
      a.href = link.href;
      a.setAttribute("data-i18n", link.key);
      a.textContent = (window.JVI18N && window.JVI18N.t(link.key)) || link.label;
      if (normalizePath(link.href) === currentPath) {
        a.setAttribute("aria-current", "page");
      }
      linksWrap.appendChild(a);
    });

    inner.appendChild(linksWrap);
    inner.appendChild(buildLangSelector());

    nav.appendChild(inner);
    root.replaceWith(nav);
  }

  function init() {
    if (window.JVI18N && window.JVI18N.ready) {
      window.JVI18N.ready.then(render);
    } else {
      render();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
