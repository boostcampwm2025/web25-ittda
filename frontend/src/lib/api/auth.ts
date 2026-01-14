import { post } from './api';
import type { ReissueResponse } from '../types/response';

let accessToken: string | null = null;
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

/**
 * 액세스 토큰 가져오기
 */
export function getAccessToken(): string | null {
  return accessToken;
}

/**
 * 액세스 토큰 설정
 */
export function setAccessToken(token: string | null) {
  accessToken = token;
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
    const response = await post<ReissueResponse>(
      '/auth/reissue',
      undefined,
      undefined,
      true, // sendCookie = true (refresh token 전송)
    );

    if (response.success) {
      const newAccessToken = response.data.accessToken;
      setAccessToken(newAccessToken);
      onTokenRefreshed(newAccessToken);
      return newAccessToken;
    }

    // 재발급 실패 (refresh token도 만료됨)
    setAccessToken(null);
    return null;
  } catch (error) {
    setAccessToken(null);
    return null;
  } finally {
    isRefreshing = false;
  }
}

/**
 * 로그아웃 (토큰 초기화)
 */
export function clearTokens() {
  setAccessToken(null);
}
