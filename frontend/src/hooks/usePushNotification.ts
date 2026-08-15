'use client';

import { useEffect } from 'react';
import {
  register as fcmRegister,
  unregister,
  onRegistered,
  onMessage,
} from 'firebase/messaging';
import type { Messaging, MessagePayload } from 'firebase/messaging';
import { getFirebaseMessaging } from '@/lib/firebase';
import { registerFcmToken } from '@/lib/api/notification';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
const FCM_SW_SCOPE = '/firebase-cloud-messaging-push-scope';

const isNativePlatform = () =>
  typeof window !== 'undefined' &&
  !!(
    window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }
  ).Capacitor?.isNativePlatform?.();

// 반환값: 서버에 FCM 토큰 등록까지 실제로 성공했는지 여부.
// registerFcmToken 실패/registrationError/타임아웃을 전부 조용히 삼키면
// 호출부(Settings 토글)가 이를 성공으로 오인해 서버엔 토큰이 없는데
// UI만 켜짐으로 남는 문제가 있었다.
export async function registerAndroidToken(): Promise<boolean> {
  const { PushNotifications } = await import('@capacitor/push-notifications');

  const result = await PushNotifications.requestPermissions();
  if (result.receive !== 'granted') return false;

  let registrationHandle: { remove: () => Promise<void> } | undefined;
  let registrationErrorHandle: { remove: () => Promise<void> } | undefined;
  const cleanup = () =>
    Promise.all([
      registrationHandle?.remove(),
      registrationErrorHandle?.remove(),
    ]);

  return await Promise.race([
    new Promise<boolean>((resolve) => {
      (async () => {
        registrationHandle = await PushNotifications.addListener(
          'registration',
          async ({ value: token }) => {
            const success = await registerFcmToken(token, 'android')
              .then(() => true)
              .catch(() => false);
            await cleanup();
            resolve(success);
          },
        );
        registrationErrorHandle = await PushNotifications.addListener(
          'registrationError',
          async () => {
            await cleanup();
            resolve(false);
          },
        );
        PushNotifications.register();
      })();
    }),
    new Promise<boolean>((resolve) =>
      setTimeout(async () => {
        await cleanup();
        resolve(false);
      }, 10000),
    ),
  ]);
}

// onRegistered 콜백을 await 가능한 형태로 변환
function registerAndGetFid(
  messaging: Messaging,
  options: {
    vapidKey: string | undefined;
    serviceWorkerRegistration: ServiceWorkerRegistration;
  },
): Promise<string | null> {
  return new Promise((resolve) => {
    const unsubOnRegistered = onRegistered(messaging, (fid) => {
      unsubOnRegistered();
      resolve(fid);
    });
    fcmRegister(messaging, options).catch(() => {
      unsubOnRegistered();
      resolve(null);
    });
  });
}

async function getAndRegisterWebFcmToken() {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return;

  const swReg = await navigator.serviceWorker.register(
    '/firebase-messaging-sw.js',
    { scope: FCM_SW_SCOPE },
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

  const options = { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg };

  const existingSub = await swReg.pushManager
    .getSubscription()
    .catch(() => null);

  if (!existingSub) {
    // SW unregister로 push subscription이 소멸한 경우:
    // 기존 FID 등록 정보를 삭제해 fcmRegister()가 새 push subscription으로 재등록하도록 강제
    await unregister(messaging).catch(() => {});
  }

  const fid = await registerAndGetFid(messaging, options);
  if (fid) {
    await registerFcmToken(fid, 'web').catch(() => {});
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

function showForegroundNotification(payload: MessagePayload) {
  if (!('serviceWorker' in navigator)) return;
  if (Notification.permission !== 'granted') return;

  const title = payload.data?.title ?? '잇다 알림';
  const body = payload.data?.body ?? '';

  navigator.serviceWorker.getRegistration(FCM_SW_SCOPE).then((registration) => {
    if (!registration) return;
    registration.showNotification(title, {
      body,
      icon: payload.data?.imageUrl || '/web-app-icon-192x192.png',
      badge: '/web-app-icon-192x192.png',
      data: payload.data ?? {},
    });
  });
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

  // 포그라운드 알림 — 탭이 활성 상태여도 백그라운드와 동일하게 알림이
  // 뜨도록 한다. 네이티브(Capacitor) 안드로이드는 자체 푸시 플러그인으로
  // 별도 처리되므로 여기선 웹(PWA/브라우저)에서만 등록한다.
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined') return;
    if (isNativePlatform()) return;

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    getFirebaseMessaging().then((messaging) => {
      if (!messaging || cancelled) return;
      unsubscribe = onMessage(messaging, showForegroundNotification);
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [enabled]);
}
