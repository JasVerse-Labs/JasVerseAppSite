/* JasVerse -- lightweight first-party i18n. No framework, no external
   translation service. English is the canonical source of truth baked
   into every page's HTML, so a missing key in any locale silently falls
   back to the real English text already in the DOM -- never a blank or
   broken string (Founder live-site addendum: "no fake translations"). */
(function () {
  "use strict";

  var STORAGE_KEY = "jasverse_locale";

  /* quality: "full" = every page translated end to end (EN/IT only, for
     now). "core" = nav + buttons + headings translated honestly; the
     rest of the page falls back to English rather than shipping partial
     machine text as if it were finished. */
  var LANGUAGES = [
    { code: "en", native: "English", flag: "🇬🇧", dir: "ltr", quality: "full" },
    { code: "it", native: "Italiano", flag: "🇮🇹", dir: "ltr", quality: "full" },
    { code: "es", native: "Español", flag: "🇪🇸", dir: "ltr", quality: "core" },
    { code: "fr", native: "Français", flag: "🇫🇷", dir: "ltr", quality: "core" },
    { code: "pt-BR", native: "Português (Brasil)", flag: "🇧🇷", dir: "ltr", quality: "core" },
    { code: "ru", native: "Русский", flag: "🇷🇺", dir: "ltr", quality: "core" },
    { code: "zh", native: "中文", flag: "🇨🇳", dir: "ltr", quality: "core" },
    { code: "hi", native: "हिन्दी", flag: "🇮🇳", dir: "ltr", quality: "core" },
    { code: "ar", native: "العربية", flag: "🇸🇦", dir: "rtl", quality: "core" },
    { code: "bn", native: "বাংলা", flag: "🇧🇩", dir: "ltr", quality: "core" },
  ];

  var byCode = {};
  LANGUAGES.forEach(function (l) { byCode[l.code] = l; });

  var dictionaries = {}; // code -> { key: value }
  var currentLocale = "en";
  var listeners = [];

  function detectInitial() {
    try {
      var stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && byCode[stored]) return stored;
    } catch (e) { /* localStorage unavailable -- fall through */ }

    var nav = (window.navigator.language || "en").toLowerCase();
    for (var i = 0; i < LANGUAGES.length; i++) {
      if (nav === LANGUAGES[i].code.toLowerCase()) return LANGUAGES[i].code;
      if (nav.split("-")[0] === LANGUAGES[i].code.toLowerCase().split("-")[0]) {
        return LANGUAGES[i].code;
      }
    }
    return "en";
  }

  function fetchDict(code) {
    if (dictionaries[code]) return Promise.resolve(dictionaries[code]);
    return fetch("/assets/i18n/" + code + ".json")
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (data) { dictionaries[code] = data; return data; })
      .catch(function () { dictionaries[code] = {}; return {}; });
  }

  function t(key) {
    var loc = dictionaries[currentLocale] || {};
    if (Object.prototype.hasOwnProperty.call(loc, key)) return loc[key];
    var en = dictionaries.en || {};
    if (Object.prototype.hasOwnProperty.call(en, key)) return en[key];
    return null; // caller should keep the existing DOM text as fallback
  }

  function applyTranslations(root) {
    var scope = root || document;
    scope.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var value = t(key);
      if (value !== null) el.textContent = value;
    });
    scope.querySelectorAll("[data-i18n-aria-label]").forEach(function (el) {
      var value = t(el.getAttribute("data-i18n-aria-label"));
      if (value !== null) el.setAttribute("aria-label", value);
    });
  }

  function applyDocumentAttrs() {
    var lang = byCode[currentLocale] || byCode.en;
    document.documentElement.setAttribute("lang", lang.code);
    document.documentElement.setAttribute("dir", lang.dir);
  }

  function setLocale(code) {
    if (!byCode[code]) return Promise.resolve();
    return fetchDict("en").then(function () {
      return fetchDict(code);
    }).then(function () {
      currentLocale = code;
      try { window.localStorage.setItem(STORAGE_KEY, code); } catch (e) { /* ignore */ }
      applyDocumentAttrs();
      applyTranslations(document);
      listeners.forEach(function (fn) { fn(code); });
    });
  }

  function onChange(fn) {
    listeners.push(fn);
  }

  function getLocale() { return currentLocale; }

  var ready = fetchDict("en").then(function () {
    var initial = detectInitial();
    return fetchDict(initial).then(function () {
      currentLocale = initial;
      applyDocumentAttrs();
      applyTranslations(document);
    });
  });

  window.JVI18N = {
    LANGUAGES: LANGUAGES,
    ready: ready,
    t: t,
    setLocale: setLocale,
    getLocale: getLocale,
    applyTranslations: applyTranslations,
    onChange: onChange,
  };
})();
