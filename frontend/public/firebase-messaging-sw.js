importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

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
  const { title = '잇다 알림', body = '' } = payload.notification ?? {};
  self.registration.showNotification(title, {
    body,
    icon: '/web-app-icon-192x192.png',
  });
});
