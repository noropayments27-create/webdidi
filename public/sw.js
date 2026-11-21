const CACHE_VERSION = "didi-repartidor-pwa-v2";
const SHELL = CACHE_VERSION + "-shell";
const STATIC = CACHE_VERSION + "-static";
const OFFLINE = "/offline.html";
const CORE = [OFFLINE, "/register-sw.js", "/__grok/manifest.webmanifest", "/icon-192.png", "/icon-512.png", "/__grok/icon-180.png", "/favicon.svg"];
self.addEventListener("install", (event) => { event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(CORE))); self.skipWaiting(); });
self.addEventListener("activate", (event) => { event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("didi-repartidor-pwa-") && key !== SHELL && key !== STATIC).map((key) => caches.delete(key))))); self.clients.claim(); });
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/") || url.pathname.startsWith("/__grok/")) return;
  if (request.mode === "navigate") { event.respondWith(fetch(request).catch(async () => (await caches.open(SHELL)).match(OFFLINE))); return; }
  const isStatic = url.pathname.startsWith("/assets/") || ["/icon-192.png", "/icon-512.png", "/favicon.svg", "/login-logo.png"].includes(url.pathname) || url.pathname.startsWith("/media/");
  if (!isStatic) return;
  event.respondWith(caches.open(STATIC).then(async (cache) => { const cached = await cache.match(request); const network = fetch(request).then((response) => { if (response.ok) cache.put(request, response.clone()); return response; }); return cached || network; }));
});
