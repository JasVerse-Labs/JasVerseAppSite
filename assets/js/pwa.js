/* JasVerse — service worker registration + honest install UX.
   Never shows a fake install button (Part 24). */
(function () {
  "use strict";

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/sw.js").catch(function () {
        /* Non-fatal: site works fully without a service worker. */
      });
    });

    /* A new service worker took control of this already-open page (the
       user is mid-visit on a release that just shipped). Never reload
       automatically -- that can drop in-progress input and, if anything
       ever re-triggers a controller change right after load, would loop.
       Show a small dismissible prompt and let the user choose. */
    var reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", function () {
      if (reloaded) return;
      showUpdateToast();
    });

    function showUpdateToast() {
      var toast = document.createElement("div");
      toast.setAttribute("role", "status");
      toast.style.cssText =
        "position:fixed;left:16px;right:16px;bottom:16px;z-index:900;" +
        "max-width:420px;margin:0 auto;padding:14px 16px;border-radius:10px;" +
        "background:#0a0c14;border:1px solid rgba(0,185,255,0.4);" +
        "box-shadow:0 8px 30px rgba(0,0,0,0.5);color:#fff;font-size:0.9rem;" +
        "display:flex;align-items:center;gap:12px;justify-content:space-between;";
      var label = (window.JVI18N && window.JVI18N.t("pwa.update.available")) || "A new version of JasVerse is ready.";
      var action = (window.JVI18N && window.JVI18N.t("pwa.update.reload")) || "Reload";
      toast.innerHTML =
        '<span>' + label + '</span>' +
        '<button type="button" style="background:transparent;border:1px solid #00b9ff;color:#00b9ff;' +
        'border-radius:6px;padding:6px 12px;cursor:pointer;font:inherit;white-space:nowrap;">' + action + '</button>';
      toast.querySelector("button").addEventListener("click", function () {
        reloaded = true;
        window.location.reload();
      });
      document.body.appendChild(toast);
    }
  }

  var deferredPrompt = null;
  var banner = document.getElementById("install-banner");
  var installBtn = document.getElementById("install-btn");

  function isIos() {
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  }

  function isInStandaloneMode() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    );
  }

  if (!banner || isInStandaloneMode()) return;

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredPrompt = e;
    banner.classList.add("visible");
  });

  if (isIos() && !isInStandaloneMode()) {
    banner.classList.add("visible");
    var text = banner.querySelector("p");
    if (text) {
      text.setAttribute("data-i18n", "install.ios.hint");
      var iosHint = (window.JVI18N && window.JVI18N.t("install.ios.hint")) ||
        "Install JasVerse: tap Share, then “Add to Home Screen”.";
      text.textContent = iosHint;
    }
    if (installBtn) installBtn.style.display = "none";
  }

  if (installBtn) {
    installBtn.addEventListener("click", function () {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(function () {
        deferredPrompt = null;
        banner.classList.remove("visible");
      });
    });
  }

  window.addEventListener("appinstalled", function () {
    banner.classList.remove("visible");
  });
})();
