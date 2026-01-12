import { refreshAccessToken, clearTokens } from '../api/auth';
import type { ApiResponse } from '../types/response';

export interface ApiError extends Error {
  code?: string;
  isAuthError?: boolean;
}

/**
 * API 에러 코드 정의
 */
export const ERROR_CODES = {
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

/**
 * 인증 에러 여부 확인
 */
export function isAuthError(errorCode?: string): boolean {
  if (!errorCode) return false;
  const authErrors: string[] = [
    ERROR_CODES.TOKEN_EXPIRED,
    ERROR_CODES.INVALID_TOKEN,
    ERROR_CODES.UNAUTHORIZED,
  ];
  return authErrors.includes(errorCode);
}

/**
 * 토큰 만료 에러 여부 확인
 */
export function isTokenExpiredError(errorCode?: string): boolean {
  return errorCode === ERROR_CODES.TOKEN_EXPIRED;
}

/**
 * API 에러를 사용자 친화적인 메시지로 변환
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return '알 수 없는 오류가 발생했습니다.';
}

/**
 * API 응답에서 에러 객체 생성
 */
export function createApiError(response: ApiResponse<unknown>): ApiError {
  if (response.success) {
    return new Error('Success response cannot create error') as ApiError;
  }

  const error = new Error(response.error.message) as ApiError;
  error.code = response.error.code;
  error.isAuthError = isAuthError(response.error.code);

  return error;
}

/**
 * 토큰 재발급 후 요청 재시도
 */
export async function retryWithTokenRefresh<T>(
  retryFn: () => Promise<T>,
): Promise<T> {
  const newToken = await refreshAccessToken();

  if (!newToken) {
    // 재발급 실패 - 로그인 페이지로 리다이렉트
    clearTokens();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
  }

  // 새 토큰으로 재시도
  return retryFn();
}
