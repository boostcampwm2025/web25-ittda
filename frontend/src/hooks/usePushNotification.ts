'use client';

import { useEffect } from 'react';
import { getToken } from 'firebase/messaging';
import { getFirebaseMessaging } from '@/lib/firebase';
import { registerFcmToken } from '@/lib/api/notification';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

const isNativePlatform = () =>
  typeof window !== 'undefined' &&
  !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
    .Capacitor?.isNativePlatform?.();

async function registerAndroidToken() {
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

async function registerWebToken() {
  if (!('Notification' in window)) return;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return;

  const messaging = await getFirebaseMessaging();
  if (!messaging) return;

  const swReg = await navigator.serviceWorker.register(
    '/firebase-messaging-sw.js',
    { scope: '/firebase-cloud-messaging-push-scope' },
  );

  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: swReg,
  });

  if (token) await registerFcmToken(token, 'web');
}

export function usePushNotification(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined') return;

    const register = isNativePlatform() ? registerAndroidToken : registerWebToken;
    register().catch(() => {});
  }, [enabled]);
}
