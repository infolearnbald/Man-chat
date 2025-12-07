self.addEventListener("install", e => {
    self.skipWaiting();
    e.waitUntil(
        caches.open("manchat-v1").then(cache => {
            return cache.addAll([
                "index.html",
                "register.html",
                "chat.html",
                "styles.css",
                "app.js",
                "manifest.json",
                "icon-192.png",
                "icon-512.png"
            ]);
        })
    );
});

self.addEventListener("fetch", e => {
    e.respondWith(
        caches.match(e.request).then(res => res || fetch(e.request))
    );
});

