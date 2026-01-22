import { auth } from '@/auth';
import { getSession, signOut } from 'next-auth/react';
import { deleteCookie } from '../utils/cookie';
import { guestCookieKey } from '@/store/useAuthStore';

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

/**
 * 액세스 토큰 가져오기
 */
export async function getAccessToken() {
  if (typeof window === 'undefined') {
    // 서버 환경이므로 Auth 서버 세션에서 가져옴
    const session = await auth();
    return session?.accessToken;
  } else {
    // 클라이언트 환경이므로 Auth 클라이언트 세션에서 가져옴
    const session = await getSession();
    return session?.accessToken;
  }
}

/**
 * 토큰 재발급 대기열에 구독자 추가
 */
function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

/**
 * 토큰 재발급 완료 시 대기 중인 요청들에게 알림
 */
function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

/**
 * 토큰 재발급 요청
 * refresh token은 httpOnly 쿠키에 저장되어 있어 자동으로 전송됨
 */
export async function refreshAccessToken(): Promise<string | null> {
  // 이미 재발급 중이면 대기
  if (isRefreshing) {
    return new Promise((resolve) => {
      subscribeTokenRefresh((token: string) => {
        resolve(token);
      });
    });
  }

  isRefreshing = true;

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      // 로그아웃 필요
      return null;
    }

    const authHeader = response.headers.get('Authorization');
    const newAccessToken = authHeader?.replace('Bearer ', '') ?? null;

    if (!newAccessToken) {
      // 로그아웃 필요
      return null;
    }

    // 브라우저의 storage 이벤트를 트리거해서 Auth 클라이언트가 storage 이벤트를 감지해 세션을 최신화
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'nextauth.message',
          newValue: JSON.stringify({
            event: 'session',
            data: { trigger: 'getSession' },
            timestamp: Math.floor(Date.now() / 1000),
          }),
        }),
      );
    }

    onTokenRefreshed(newAccessToken);
    return newAccessToken;
  } catch {
    return null;
  } finally {
    isRefreshing = false;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function refreshServerAccessToken(token: any) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/auth/refresh`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      },
    );

    const data = await response.json();
    if (!response.ok) throw data;

    const newAccessToken = response.headers
      .get('Authorization')
      ?.replace('Bearer ', '');

    return {
      ...token,
      accessToken: newAccessToken,
      accessTokenExpires: Date.now() + 14 * 60 * 1000,
    };
  } catch (error) {
    console.error('서버 토큰 갱신 실패', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

export async function handleLogout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });

    deleteCookie(guestCookieKey);

    await signOut({ callbackUrl: '/login' });
  } catch (error) {
    console.error('로그아웃 중 에러 발생', error);
    window.location.href = '/login';
  }
}
