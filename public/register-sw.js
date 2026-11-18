if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error) => {
      console.error("[Didi repartidor] No se pudo registrar el service worker:", error);
    });
  });
}
