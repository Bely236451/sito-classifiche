// Service worker: prima la rete (dati sempre aggiornati), la copia salvata solo se sei offline.
const V = 'cl-v1';
const CORE = ['./', 'index.html', 'styles.css', 'script.js', 'data.json', 'manifest.webmanifest',
  'img/logo-lega.png', 'img/bp-eagles.webp', 'img/jagermaister.webp', 'img/lostallones.webp',
  'img/merli-fn.webp', 'img/sobri-sinceri.webp', 'img/titani.webp'];
self.addEventListener('install', e => e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; })
    .catch(() => caches.match(r).then(m => m || caches.match('index.html'))));
});
