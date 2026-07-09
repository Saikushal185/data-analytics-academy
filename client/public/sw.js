// Minimal service worker: offline app-shell + cached content payload.
// Playgrounds and the AI tutor still need the network.
const CACHE = 'daa-v1'
const SHELL = ['/', '/icon.svg', '/manifest.webmanifest']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  // Content payload: network-first, fall back to cache (offline reading).
  if (url.pathname === '/api/content') {
    e.respondWith(
      fetch(request).then((res) => { caches.open(CACHE).then((c) => c.put(request, res.clone())); return res })
        .catch(() => caches.match(request))
    )
    return
  }
  // Other API calls: always network (auth/progress/sql/tutor).
  if (url.pathname.startsWith('/api/')) return

  // Navigations: serve cached shell when offline.
  if (request.mode === 'navigate') {
    e.respondWith(fetch(request).catch(() => caches.match('/')))
    return
  }
  // Static assets: cache-first (hashed filenames are safe to cache).
  e.respondWith(
    caches.match(request).then((hit) => hit || fetch(request).then((res) => {
      if (res.ok && url.origin === location.origin) caches.open(CACHE).then((c) => c.put(request, res.clone()))
      return res
    }))
  )
})
