// Lets Julie Medcare open with no internet.
// Each time it opens, it tries to get the newest version from the web (waiting up to 4 seconds);
// if there's no internet, it uses the copy saved on this device.
const CACHE = 'julie-medcare-v1';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const fromWeb = fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  });
  const fromDevice = () => caches.match(req, { ignoreSearch: true }).then(m => m || caches.match('./index.html'));
  const slow = new Promise(resolve => setTimeout(resolve, 4000)).then(fromDevice);
  e.respondWith(Promise.race([fromWeb, slow]).then(r => r || fromWeb).catch(fromDevice));
});
