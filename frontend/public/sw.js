// Minimal PWA service worker
// PWA 설치 기준을 충족하기 위한 최소 서비스 워커
// skipWaiting + clients.claim으로 새로고침 시 즉시 활성화되어
// Chrome이 설치 가능 여부를 항상 감지할 수 있게 함

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// fetch 핸들러가 있어야 Chrome이 PWA installable로 인정함
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
