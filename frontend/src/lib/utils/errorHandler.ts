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
