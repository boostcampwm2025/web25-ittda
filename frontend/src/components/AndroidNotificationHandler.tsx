'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { recordDetailOptions } from '@/lib/api/records';

// 모듈 레벨에서 이벤트를 캡처 — useEffect보다 먼저 실행되어 cold start 이벤트를 놓치지 않음
let pendingRoute: string | null = null;
let navigateFn: ((route: string) => void) | null = null;

function handleNotificationAction(data: Record<string, string> | undefined) {
  const postId = data?.postId;
  const groupId = data?.groupId;
  const route =
    postId && groupId
      ? `/record/${postId}?scope=group&groupId=${groupId}`
      : postId
        ? `/record/${postId}`
        : groupId
          ? `/group/${groupId}`
          : null;
  if (!route) return;

  if (navigateFn) {
    navigateFn(route);
  } else {
    pendingRoute = route;
  }
}

if (typeof window !== 'undefined') {
  const platform = (
    window as unknown as { Capacitor?: { getPlatform?: () => string } }
  ).Capacitor?.getPlatform?.();

  if (platform === 'android') {
    import('@capacitor/push-notifications').then(({ PushNotifications }) => {
      PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (action) => {
          handleNotificationAction(
            action.notification.data as Record<string, string> | undefined,
          );
        },
      );
    });
  }
}

function extractPostId(route: string): string | null {
  const match = route.match(/\/record\/([^?]+)/);
  return match ? match[1] : null;
}

export default function AndroidNotificationHandler() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.userId);
  const queryClient = useQueryClient();

  useEffect(() => {
    // 인증된 상태에서만 라우팅 실행
    if (!userId) return;

    navigateFn = (route: string) => {
      // navigate와 동시에 prefetch — 컴포넌트 마운트 시 캐시 히트 가능성을 높임
      const postId = extractPostId(route);
      if (postId) {
        queryClient.prefetchQuery(recordDetailOptions(postId)).catch(() => {});
      }
      router.push(route);
    };

    if (pendingRoute) {
      const route = pendingRoute;
      pendingRoute = null;
      navigateFn(route);
    }

    return () => {
      navigateFn = null;
    };
  }, [router, userId, queryClient]);

  return null;
}
