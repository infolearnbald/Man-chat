const CACHE_NAME = 'man-chat-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/login.html',
  '/signup.html',
  '/chat.html',
  '/profile.html',
  '/style.css',
  '/app.js',
  '/manifest.json'
];

// install
self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// activate
self.addEventListener('activate', evt => {
  evt.waitUntil(self.clients.claim());
});

// fetch
self.addEventListener('fetch', evt => {
  evt.respondWith(
    caches.match(evt.request).then(resp => resp || fetch(evt.request))
  );
});
