const CACHE = 'tirage-smart-v4';
// Core shell, fonts and import libraries are precached. OCR files (libs/tesseract/*) are cached on first use.
const SHELL = [
  './', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png',
  './fonts/readex-pro-arabic-400-normal.woff2', './fonts/readex-pro-arabic-500-normal.woff2', './fonts/readex-pro-arabic-700-normal.woff2',
  './fonts/readex-pro-latin-400-normal.woff2', './fonts/readex-pro-latin-500-normal.woff2', './fonts/readex-pro-latin-700-normal.woff2',
  './libs/xlsx.full.min.js', './libs/mammoth.browser.min.js',
  './libs/pdf.min.js', './libs/pdf.worker.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Share-target launches (index.html?text=...) reuse the cached shell
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      const net = fetch(req).then(res => {
        if (res && res.ok && !url.search) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined));
      return hit || net;
    })
  );
});
