if ("serviceWorker" in navigator && window.isSecureContext) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    }).then((registration) => registration.update()).catch((error) => {
      console.error("[Didi repartidor] No se pudo registrar el service worker:", error);
    });
  }, { once: true });
}
