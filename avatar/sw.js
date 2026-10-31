// The Cave service worker — scope: /smartcardiofit/avatar/
const VERSION = 'cave-v6';
// Models are cached by filename (batman-epic-v3b.glb etc.); bump MODELS only if a .glb is ever replaced in place.
const MODELS = 'cave-models';
const SHELL = ['./', 'index.html', 'style.css', 'app.js', 'manifest.json', 'icon-192.png', 'icon-512.png', 'icon-mask.svg',
  ...['greeting','who','can','time','brief','joke','thanks','bye','fallback'].flatMap((id) => [`lines/${id}.json`, `lines/${id}.mp3`])];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('cave-') && k !== VERSION && k !== VERSION + '-cdn' && k !== MODELS).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameScope = url.origin === location.origin && url.pathname.startsWith(new URL('./', self.registration.scope).pathname);
  const cdn = /(^|\.)jsdelivr\.net$|fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!sameScope && !cdn) return;
  if (sameScope && /\.glb$/.test(url.pathname)) {
    // Avatar model: cache first (filename is versioned, e.g. batman-epic-v3b.glb), so the phone doesn't re-download ~13 MB.
    e.respondWith(caches.open(MODELS).then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) c.put(req, res.clone());
      return res;
    }))));
  } else if (sameScope) {
    // App shell: network first (fresh deploys win), cache fallback offline.
    e.respondWith(fetch(req).then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return res; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('index.html'))));
  } else {
    // CDN (three.js, TalkingHead, avatar GLB, fonts): cache first — versions are pinned.
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(VERSION + '-cdn').then((c) => c.put(req, copy)); }
      return res;
    })));
  }
});
