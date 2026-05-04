const CACHE_NAME = "speedcubing-cheatsheet-v1";
const APP_SHELL = [
    "./",
    "./index.html",
    "./speedcubing-2x2.html",
    "./speedcubing-3x3.html",
    "./speedcubing-4x4.html",
    "./speedcubing-cheatsheet.css",
    "./speedcubing-utils.js",
    "./speedcubing-app.js",
    "./speedcubing-config-2x2.json",
    "./speedcubing-config-3x3.json",
    "./speedcubing-config-4x4.json",
    "./manifest.webmanifest",
    "./icons/icon-192.svg",
    "./icons/icon-512.svg"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    const request = event.request;
    if (request.method !== "GET") {
        return;
    }

    const url = new URL(request.url);
    if (url.origin !== self.location.origin) {
        return;
    }

    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request).catch(() => caches.match("./index.html"))
        );
        return;
    }

    event.respondWith(
        caches.match(request, { ignoreSearch: true }).then((cached) => {
            if (cached) {
                return cached;
            }

            return fetch(request)
                .then((response) => {
                    if (response && response.ok) {
                        const cloned = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
                    }
                    return response;
                })
                .catch(() => caches.match("./index.html"));
        })
    );
});
