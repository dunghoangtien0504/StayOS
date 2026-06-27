const CACHE = 'stayos-v1';
const STATIC = [
  '/',
  '/dashboard',
  '/inbox',
  '/timeline',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  // Only cache GET requests, skip API calls
  if (request.method !== 'GET') return;
  if (request.url.includes('/api/')) return;

  e.respondWith(
    fetch(request)
      .then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(request, clone));
        }
        return res;
      })
      .catch(() => caches.match(request))
  );
});

// Push notification support
self.addEventListener('push', (e) => {
  const data = e.data?.json() || {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'StayOS', {
      body: data.body || 'Có tin nhắn mới',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'stayos-msg',
      renotify: true,
      data: { url: data.url || '/inbox' },
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      const url = e.notification.data?.url || '/inbox';
      const existing = list.find(c => c.url.includes(url) && 'focus' in c);
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});
