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

export function usePushNotification(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    if (isNativePlatform()) return;
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;

    let cancelled = false;

    (async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted' || cancelled) return;

        const messaging = await getFirebaseMessaging();
        if (!messaging || cancelled) return;

        const swReg = await navigator.serviceWorker.register(
          '/firebase-messaging-sw.js',
          { scope: '/firebase-cloud-messaging-push-scope' },
        );

        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: swReg,
        });

        if (!token || cancelled) return;

        await registerFcmToken(token, 'web');
      } catch {
        // 알림 권한 거부나 지원 불가 환경은 무시
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);
}
