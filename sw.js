// Permite que la app funcione sin internet y se actualice sola.
// Los archivos de la app se buscan primero en internet (así siempre ves la última versión subida a GitHub);
// sin conexión, o si tarda más de 4 segundos, se usa la copia guardada en el teléfono.
const CACHE = 'tesitura-v12';
const ASSETS = ['./', './index.html', './styles.css', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png',
  './js/core.js', './js/ui.js', './js/lessons.js', './js/students.js', './js/shows.js', './js/views.js', './js/stats.js', './js/settings.js', './js/app.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' })))));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  const net = fetch(req.url, { cache: 'no-store', credentials: 'same-origin' }).then(res => {
    if (res && res.ok) { cache.put(req.url, res.clone()); if (new URL(req.url).pathname.endsWith('/')) cache.put('./index.html', res.clone()); }
    return res;
  });
  try {
    const res = await Promise.race([net, new Promise((_, no) => setTimeout(() => no(new Error('lento')), 4000))]);
    if (res && res.ok) return res;
  } catch (e) {}
  return (await cache.match(req, { ignoreSearch: true })) || (req.mode === 'navigate' ? await cache.match('./index.html') : null) || net;
}
// librerías de exportación (PDF/Excel): se guardan la primera vez que se usan
async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && res.ok) cache.put(req, res.clone());
  return res;
}
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  if (url.hostname === 'cdnjs.cloudflare.com') { e.respondWith(cacheFirst(req)); return; }
  // los datos de tu cuenta (Supabase) siempre van directo a internet
  if (url.origin !== self.location.origin) return;
  e.respondWith(networkFirst(req));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then(cs => cs.length ? cs[0].focus() : self.clients.openWindow('./')));
});
