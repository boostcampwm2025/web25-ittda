import { auth } from '@/auth';
import { getSession, signOut } from 'next-auth/react';
import { deleteCookie } from '../utils/cookie';
import { guestCookieKey } from '@/store/useAuthStore';
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
    // 서버 환경이므로 Auth 서버 세션에서 가져옴
    const session = await auth();
    return session?.accessToken;
  } else {
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
      sessionPromise = getSession();
      const session = await sessionPromise;

      // 성공 시 캐싱 업데이트
      cachedSession = session;
      cacheExpiry = Date.now() + CACHE_TIME;

      return session?.accessToken;
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
      // NextAuth가 사용하는 것과 동일한 채널 생성
      if (typeof BroadcastChannel !== 'undefined') {
        // 최신 브라우저: BroadcastChannel만 사용
        const bc = new BroadcastChannel('next-auth');
        bc.postMessage({
          event: 'session',
          senderId: INSTANCE_ID,
          data: { trigger: 'getSession' },
        });
        bc.close();
      } else {
        // 구형 브라우저 폴백: BroadcastChannel이 없을 때만 StorageEvent 발생
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'nextauth.message',
            newValue: JSON.stringify({
              event: 'session',
              senderId: INSTANCE_ID,
              data: { trigger: 'getSession' },
              timestamp: Math.floor(Date.now() / 1000),
            }),
          }),
        );
      }
    }

    onTokenRefreshed(newAccessToken);
    return newAccessToken;
  } catch {
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
        accessToken: newAccessToken,
        refreshToken: newRefreshToken || token.refreshToken,
        // 백엔드 토큰 만료(2분)보다 약간 일찍 갱신하도록 설정
        accessTokenExpires: Date.now() + 2 * 60 * 1000 - 10000,
      };
    } catch (error) {
      console.error('서버 토큰 갱신 실패', error);
      return { error: 'RefreshAccessTokenError' };
    }
  })();

  try {
    const result = await serverRefreshPromise;
    return { ...token, ...result };
  } finally {
    serverRefreshPromise = null;
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
