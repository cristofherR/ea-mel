/* EA Spacework · service worker mínimo: red primero, caché como respaldo (offline) */
const CACHE = 'easw-v3';
const SHELL = ['/', '/index.html', '/css/app.css', '/js/app.js', '/manifest.webmanifest',
               '/icon-192.png', '/icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(()=>{})).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (u.pathname.startsWith('/api/')) {                 // API: red, sin caché
    e.respondWith(fetch(e.request).catch(() => new Response('{"error":"sin conexión"}', {status:503, headers:{'Content-Type':'application/json'}})));
    return;
  }
  e.respondWith(fetch(e.request).then(r => {
    const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)).catch(()=>{});
    return r;
  }).catch(() => caches.match(e.request).then(m => m || caches.match('/index.html'))));
});
