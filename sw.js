// Cache only the public application shell. Never cache vaults, exports, uploads,
// OAuth responses, Drive files, API requests or arbitrary navigation targets.
const CACHE_PREFIX = 'password-manager-shell-';
const CACHE_NAME = CACHE_PREFIX + '1.2.0';
const FILES = [
  './', './index.html', './styles.css', './app.mjs', './crypto.mjs', './vault.mjs',
  './csv.mjs', './i18n.mjs', './pwa.mjs', './drive.mjs', './drive-ui.mjs', './config.mjs', './session.mjs', './api-keys.mjs',
  './manifest.webmanifest', './manifest.en.webmanifest', './icon.svg',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png',
  './docs/USER_GUIDE_RU.md', './docs/USER_GUIDE_EN.md', './docs/guide.html',
];
const urls = FILES.map(file => new URL(file, self.location.href).href);
const allowed = new Set(urls);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urls)));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'ACTIVATE_UPDATE') event.waitUntil(self.skipWaiting());
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !allowed.has(event.request.url)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(event.request);
    return cached || fetch(event.request);
  })());
});
