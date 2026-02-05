import { auth } from '@/auth';
import { getSession, signOut } from 'next-auth/react';
import { deleteCookie, getCookie } from '../utils/cookie';
import {
  guestCookieKey,
  guestTokenKey,
  useAuthStore,
} from '@/store/useAuthStore';
import * as Sentry from '@sentry/nextjs';
import { logger } from '../utils/logger';
import { destroySocketInstance } from '@/lib/socket/socketSingleton';

import type { Session } from 'next-auth';

const INSTANCE_ID =
  typeof window !== 'undefined'
    ? Math.random().toString(36).substring(2, 15)
    : 'server';
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// 클라이언트 세션 캐싱
let cachedSession: Session | null = null;
let cacheExpiry = 0;
const CACHE_TIME = 5 * 60 * 1000; // 5분

/** 세션 캐시 무효화 (로그인 전환 시 호출) */
export function invalidateSessionCache() {
  cachedSession = null;
  cacheExpiry = 0;
}

// BroadcastChannel로 다른 탭/토큰 갱신 감지 시 캐시 무효화
if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
  const bc = new BroadcastChannel('next-auth');
  bc.addEventListener('message', (event) => {
    const isAuthSessionEvent = event.data?.event === 'session';
    const hasForeignSenderId =
      event.data?.senderId && event.data?.senderId !== INSTANCE_ID;
    // 캐시를 무효화해야 하는 상황:
    // 세션 이벤트여야 함
    // 메세지에 senderId가 명시되어 있고, 그게 내가 아닐 때 (확실한 타 탭의 이벤트)
    if (isAuthSessionEvent && hasForeignSenderId) {
      cachedSession = null;
      cacheExpiry = 0;
    }
  });
}

let sessionPromise: Promise<Session | null> | null = null;

/**
 * 액세스 토큰 가져오기
 * 클라이언트 환경에서는 5분간 메모리 캐시 사용
 */
export async function getAccessToken() {
  if (typeof window === 'undefined') {
    // 서버 컴포넌트 환경 처리
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();

    // NextAuth 세션을 먼저 확인 (소셜 로그인 우선)
    const session = await auth();
    if (session?.accessToken) {
      return session.accessToken;
    }

    // 세션이 없을 때만 게스트 토큰 확인 (게스트 상태)
    const guestToken = cookieStore.get('x-guest-access-token')?.value;
    if (guestToken) return guestToken;

    return null;
  } else {
    // 클라이언트 환경 처리
    const authState = useAuthStore.getState();

    // 게스트라면 복잡한 캐시 로직 없이 즉시 반환 (게스트 세션은 메모리 캐시보다 스토어가 정확함)
    if (authState.userType === 'guest' && authState.guestAccessToken) {
      return authState.guestAccessToken || getCookie('x-guest-access-token');
    }

    // 소셜 로그인 유저를 위한 캐시 및 세션 로직
    const now = Date.now();

    // 메모리에 유효한 캐시가 있다면 즉시 반환
    if (cachedSession && now < cacheExpiry) {
      return cachedSession.accessToken;
    }

    // 이미 세션을 가져오는 중이라면 그 Promise를 같이 기다림
    if (sessionPromise) {
      const session = await sessionPromise;
      return session?.accessToken;
    }

    // 캐시도 없고 진행 중인 요청도 없다면 새로 요청
    try {
      // NextAuth는 로그인 identity 확인 용도로만 사용
      sessionPromise = getSession();
      const session = await sessionPromise;

      // 성공 시 캐싱 업데이트
      cachedSession = session;
      cacheExpiry = Date.now() + CACHE_TIME;

      if (session?.accessToken) return session?.accessToken;
    } finally {
      // 요청이 끝났으므로 Promise 참조 제거 (다음 요청을 위해)
      sessionPromise = null;
    }
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
  if (isRefreshing) {
    return new Promise((resolve) => subscribeTokenRefresh(resolve));
  }

  isRefreshing = true;

  try {
    const { userType } = useAuthStore.getState();

    if (userType === 'guest') return null;

    // getSession 제거 후 직접 호출로 변경
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/auth/refresh`,
      {
        method: 'POST',
        credentials: 'include',
      },
    );

    if (!res.ok) {
      handleLogout();
      return null;
    }

    const newToken = res.headers.get('Authorization')?.replace('Bearer ', '');

    if (!newToken) return null;

    onTokenRefreshed(newToken);

    return newToken;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return null;
  } finally {
    isRefreshing = false;
  }
}

// 서버 사이드 토큰 갱신 동시 요청 방지용 mutex
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let serverRefreshPromise: Promise<any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function refreshServerAccessToken(token: any) {
  // 이미 갱신 중이면 진행 중인 요청의 결과를 재사용
  if (serverRefreshPromise) {
    const result = await serverRefreshPromise;
    return { ...token, ...result };
  }

  serverRefreshPromise = (async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/auth/refresh`,
        {
          method: 'POST',
          //credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `refreshToken=${token.refreshToken}`,
          },
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw data;
      }

      const newAccessToken = response.headers
        .get('Authorization')
        ?.replace('Bearer ', '');

      const setCookie = response.headers.get('set-cookie');
      const refreshCookiePart = setCookie
        ?.split(';')
        .find((c) => c.trim().startsWith('refreshToken='));
      const newRefreshToken = refreshCookiePart
        ?.trim()
        .substring('refreshToken='.length);

      return {
        ...token,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken || token.refreshToken,
        // 백엔드 토큰 만료(15분)보다 약간 일찍 갱신하도록 설정
        accessTokenExpires:
          Date.now() +
          15 * 60 * 1000 -
          60 * 1000 -
          Math.floor(Math.random() * 10000),
        error: null,
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          context: 'auth',
          operation: 'refresh-server-token',
        },
        extra: {
          hasRefreshToken: !!token.refreshToken,
        },
      });
      logger.error('서버 토큰 갱신 실패', error);

      return { ...token, error: 'RefreshAccessTokenError' };
    } finally {
      serverRefreshPromise = null;
    }
  })();

  return serverRefreshPromise;
}

export async function handleLogout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });

    deleteCookie(guestCookieKey);
    deleteCookie(guestTokenKey);
    destroySocketInstance();

    await signOut({ callbackUrl: '/login' });
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        context: 'auth',
        operation: 'logout',
      },
    });
    logger.error('로그아웃 중 에러 발생', error);

    window.location.href = '/login';
  }
}
