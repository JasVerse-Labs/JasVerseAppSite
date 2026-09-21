'use strict';
window.OracoloI18n = (() => {
  const DEFAULT_LOCALE = window.OracoloCanonicalLocale || 'it';
  const preferenceKey = 'jasverse_oracolo_locale';
  const locales = window.OracoloLocales;
  const sources = window.OracoloSources;
  const normalize = value => String(value).trim().replace(/\s+/g, ' ');
  const sourceIds = new Map(Object.entries(sources).map(([id, value]) => [normalize(value), id]));
  const canonicalIds = new Map(Object.entries(locales[DEFAULT_LOCALE].messages).map(([id, value]) => [normalize(value), id]));
  const sourceNodes = new WeakMap();
  const sourceAttributes = new WeakMap();
  const missing = new Set();
  const properNames = new Set([
    'JasVerse', 'JASVERSE', 'THE ORACOLO', 'The Oracolo', 'MaiKore', 'MAIKORE', 'OSHI',
    'TheBossKey', 'THEBOSSKEY', 'ByeByePrice', 'BBP', 'JasVerse Lab', 'JASVERSE — THE ORACOLO',
    'Italiano', 'English', 'Español', 'Français', 'Deutsch', 'Português (Brasil)', '简体中文', 'हिन्दी', 'kg'
  ]);
  const patterns = window.OracoloMessagePatterns.map(([source]) => {
    const normalizedSource = normalize(source);
    const id = sourceIds.get(normalizedSource);
    const names = [];
    const expression = normalizedSource.split(/(\{\w+\})/g).map(part => {
      if (/^\{\w+\}$/.test(part)) {
        const name = part.slice(1, -1);
        names.push(name);
        return name === 'number' ? '(\\d+)' : '(.+?)';
      }
      return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }).join('');
    return {id, names, regex: new RegExp(`^${expression}$`)};
  }).filter(pattern => pattern.id);

  let locale = DEFAULT_LOCALE;
  try {
    const saved = localStorage.getItem(preferenceKey);
    if (Object.hasOwn(locales, saved)) locale = saved;
  } catch { /* Italian remains available when storage is blocked. */ }

  function message(id, target = locale) {
    return locales[target]?.messages?.[id] || locales[DEFAULT_LOCALE].messages[id] || sources[id];
  }

  function findId(source) {
    return sourceIds.get(source) || canonicalIds.get(source);
  }

  function translate(value, target = locale, depth = 0) {
    const source = normalize(value);
    const id = findId(source);
    if (id) return message(id, target);
    if (properNames.has(source) || !/[\p{L}]/u.test(source) || depth > 5) return source;
    const capitalized = source.charAt(0).toLocaleUpperCase('en') + source.slice(1);
    const capitalizedId = source !== capitalized ? findId(capitalized) : null;
    if (capitalizedId) {
      const result = message(capitalizedId, target);
      return result.charAt(0).toLocaleLowerCase(locales[target]?.format || target) + result.slice(1);
    }
    for (const pattern of patterns) {
      const match = source.match(pattern.regex);
      if (!match) continue;
      const values = Object.fromEntries(pattern.names.map((name, index) => [name, translate(match[index + 1], target, depth + 1)]));
      return message(pattern.id, target).replace(/\{(\w+)\}/g, (_, name) => values[name] ?? `{${name}}`);
    }
    missing.add(source);
    return source;
  }

  function apply(root = document.body) {
    root.querySelectorAll('[data-i18n]').forEach(element => { element.textContent = translate(element.dataset.i18n); });
    root.querySelectorAll('[data-i18n-aria]').forEach(element => { element.setAttribute('aria-label', translate(element.dataset.i18nAria)); });
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement.closest('script,style,noscript,textarea,[data-user-text],[data-i18n],[data-locale-menu]')) continue;
      if (!sourceNodes.has(node)) sourceNodes.set(node, node.textContent);
      const source = sourceNodes.get(node);
      if (!source.trim()) continue;
      node.textContent = source.match(/^\s*/)[0] + translate(source) + source.match(/\s*$/)[0];
    }
    root.querySelectorAll('[aria-label]:not([data-i18n-aria]),[title],[placeholder]').forEach(element => {
      const attributes = sourceAttributes.get(element) || {};
      for (const name of ['aria-label', 'title', 'placeholder']) {
        if (!element.hasAttribute(name) || (name === 'aria-label' && element.hasAttribute('data-i18n-aria'))) continue;
        if (!(name in attributes)) attributes[name] = element.getAttribute(name);
        element.setAttribute(name, translate(attributes[name]));
      }
      sourceAttributes.set(element, attributes);
    });
    document.documentElement.lang = locale;
    document.documentElement.dir = locales[locale]?.dir || 'ltr';
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = translate('An independent, simulated exploration of human capability. JASVERSE — THE ORACOLO concept prototype.');
    const menu = document.querySelector('#locale-select');
    if (menu) menu.value = locale;
  }

  function select(next) {
    locale = Object.hasOwn(locales, next) ? next : DEFAULT_LOCALE;
    try { localStorage.setItem(preferenceKey, locale); return true; } catch { return false; }
  }

  function hasCompleteCatalog(code) {
    return Object.keys(sources).every(id => typeof locales[code]?.messages?.[id] === 'string' && locales[code].messages[id].trim());
  }

  const menu = document.querySelector('#locale-select');
  if (menu) {
    menu.replaceChildren(...Object.entries(locales).map(([code, data]) => {
      const option = document.createElement('option');
      option.value = code;
      option.lang = code;
      option.textContent = `${code.toUpperCase()} · ${data.name}`;
      return option;
    }));
    menu.value = locale;
  }

  return {
    DEFAULT_LOCALE, preferenceKey, locales, missing, translate, apply, select, hasCompleteCatalog,
    get locale() { return locale; },
    get format() { return locales[locale]?.format || locale; }
  };
})();
