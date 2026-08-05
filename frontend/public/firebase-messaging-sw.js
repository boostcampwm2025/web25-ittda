self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) =>
  event.waitUntil(self.clients.claim()),
);

// firebase.messaging()보다 먼저 등록해야 함.
// Firebase compat 내부 notificationclick 핸들러가 나중에 등록되므로
// 우리 핸들러가 먼저 실행되어 user gesture context 안에서 openWindow를 호출할 수 있음.
// 반대 순서로 등록하면 Firebase 핸들러가 첫 번째 클릭 시 context를 소비해
// 우리 openWindow가 no-op이 되는 문제가 발생함.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const { groupId, postId } = event.notification.data ?? {};
  const url =
    postId && groupId
      ? `/record/${postId}?scope=group&groupId=${groupId}`
      : postId
        ? `/record/${postId}`
        : groupId
          ? `/group/${groupId}`
          : '/shared';

  // clients.navigate()/postMessage()/BroadcastChannel은 모두 SW가 해당 클라이언트를
  // 제어할 때만 동작함. Firebase SW 스코프(/firebase-cloud-messaging-push-scope)는
  // 앱 페이지를 제어하지 않으므로, openWindow로 직접 URL 열기가 가장 확실한 방법.
  // PWA: 기존 창 재사용 / 일반 브라우저: 새 탭으로 열림.
  // 백그라운드 브라우저 → 포그라운드 전환도 notificationclick 사용자 제스처로 허용됨.
  event.waitUntil(clients.openWindow(url));
});

importScripts(
  'https://www.gstatic.com/firebasejs/12.15.0/firebase-app-compat.js',
);
importScripts(
  'https://www.gstatic.com/firebasejs/12.15.0/firebase-messaging-compat.js',
);

firebase.initializeApp({
  apiKey: 'AIzaSyAaP2MD3vim6zP0OQYw4AFAfP2nWh5GlDk',
  authDomain: 'friendly-magnet-481309-k6.firebaseapp.com',
  projectId: 'friendly-magnet-481309-k6',
  storageBucket: 'friendly-magnet-481309-k6.firebasestorage.app',
  messagingSenderId: '513351224432',
  appId: '1:513351224432:web:e1cd1b1b39ee73862bb8b5',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  // 백엔드에서 웹 토큰에는 data-only 메시지를 보냄 (notification 필드 없음).
  // Firebase 자동 표시 없이 여기서만 알림을 표시하므로 중복 없음.
  // icon(프로필/그룹 사진)이 없으면 기본 앱 아이콘으로 대체.
  const title = payload.data?.title ?? '잇다 알림';
  const body = payload.data?.body ?? '';
  self.registration.showNotification(title, {
    body,
    icon: payload.data?.imageUrl || '/web-app-icon-192x192.png',
    badge: '/web-app-icon-192x192.png',
    data: payload.data ?? {},
  });
});
