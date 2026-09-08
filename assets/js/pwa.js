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
    if (installBtn) installBtn.textContent = "Install JasVerse";
  });

  if (isIos() && !isInStandaloneMode()) {
    banner.classList.add("visible");
    var text = banner.querySelector("p");
    if (text) {
      text.textContent =
        "Install JasVerse: tap Share, then “Add to Home Screen”.";
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
