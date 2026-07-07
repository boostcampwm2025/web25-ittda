'use client';

import { useEffect } from 'react';
import { getToken, deleteToken } from 'firebase/messaging';
import { getFirebaseMessaging } from '@/lib/firebase';
import { registerFcmToken } from '@/lib/api/notification';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

const isNativePlatform = () =>
  typeof window !== 'undefined' &&
  !!(
    window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }
  ).Capacitor?.isNativePlatform?.();

export async function registerAndroidToken() {
  const { PushNotifications } = await import('@capacitor/push-notifications');

  const result = await PushNotifications.requestPermissions();
  if (result.receive !== 'granted') return;

  await new Promise<void>((resolve) => {
    PushNotifications.addListener('registration', async ({ value: token }) => {
      await registerFcmToken(token, 'android').catch(() => {});
      await PushNotifications.removeAllListeners();
      resolve();
    });
    PushNotifications.addListener('registrationError', async () => {
      await PushNotifications.removeAllListeners();
      resolve();
    });
    PushNotifications.register();
  });
}

async function getAndRegisterWebFcmToken() {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return;

  const swReg = await navigator.serviceWorker.register(
    '/firebase-messaging-sw.js',
    { scope: '/firebase-cloud-messaging-push-scope' },
  );

  if (!swReg.active) {
    await new Promise<void>((resolve) => {
      const sw = swReg.installing ?? swReg.waiting;
      if (!sw) {
        resolve();
        return;
      }
      const handler = () => {
        if (sw.state === 'activated') {
          sw.removeEventListener('statechange', handler);
          resolve();
        }
      };
      sw.addEventListener('statechange', handler);
      if (sw.state === 'activated' || swReg.active) {
        sw.removeEventListener('statechange', handler);
        resolve();
      }
    });
  }

  const existingSub = await swReg.pushManager
    .getSubscription()
    .catch(() => null);

  if (!existingSub) {
    await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
    }).catch(() => {});
    await deleteToken(messaging).catch(() => {});
  }

  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: swReg,
  }).catch(() => null);

  if (token) {
    await registerFcmToken(token, 'web').catch(() => {});
  }
}

// 로그인 후 자동 갱신용 — 이미 허용된 경우에만 조용히 토큰 등록 (다이얼로그 없음)
async function registerWebToken() {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  await getAndRegisterWebFcmToken();
}

// Settings 토글 클릭 시 — 브라우저 권한 다이얼로그 표시 후 토큰 등록
export async function requestAndRegisterWebToken() {
  if (!('Notification' in window)) return;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return;

  await getAndRegisterWebFcmToken();
}

export function usePushNotification(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined') return;

    const register = isNativePlatform()
      ? registerAndroidToken
      : registerWebToken;
    register().catch(() => {});
  }, [enabled]);
}
