import type { ApiResponse } from '../types/response';

export interface ApiError extends Error {
  code?: string;
  isAuthError?: boolean;
  requestId?: string;
}

export const ERROR_CODES = {
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  INVALID_AUTH_CODE: 'INVALID_AUTH_CODE',
  ACCESS_TOKEN_REQUIRED: 'ACCESS_TOKEN_REQUIRED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  REFRESH_TOKEN_NOT_FOUND: 'REFRESH_TOKEN_NOT_FOUND',
  REFRESH_TOKEN_REUSE_DETECTED: 'REFRESH_TOKEN_REUSE_DETECTED',
  REFRESH_TOKEN_EXPIRED: 'REFRESH_TOKEN_EXPIRED',
  SESSION_INVALID: 'SESSION_INVALID',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

const DEFAULT_ERROR_MESSAGE =
  '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ERROR_CODES.BAD_REQUEST]: '요청 내용을 확인해 주세요.',
  [ERROR_CODES.VALIDATION_ERROR]: '입력값을 확인해 주세요.',
  [ERROR_CODES.UNAUTHORIZED]: '로그인이 필요합니다.',
  [ERROR_CODES.FORBIDDEN]: '이 작업을 수행할 권한이 없습니다.',
  [ERROR_CODES.TOKEN_EXPIRED]:
    '로그인 시간이 만료되었습니다. 다시 로그인해 주세요.',
  [ERROR_CODES.INVALID_TOKEN]:
    '유효하지 않은 인증 정보입니다. 다시 로그인해 주세요.',
  [ERROR_CODES.INVALID_AUTH_CODE]:
    '유효하지 않거나 만료된 인증 요청입니다. 다시 로그인해 주세요.',
  [ERROR_CODES.ACCESS_TOKEN_REQUIRED]: '로그인이 필요합니다.',
  [ERROR_CODES.USER_NOT_FOUND]:
    '사용자 정보를 확인할 수 없습니다. 다시 로그인해 주세요.',
  [ERROR_CODES.REFRESH_TOKEN_NOT_FOUND]:
    '로그인 정보가 없습니다. 다시 로그인해 주세요.',
  [ERROR_CODES.REFRESH_TOKEN_REUSE_DETECTED]:
    '로그인 정보가 유효하지 않습니다. 다시 로그인해 주세요.',
  [ERROR_CODES.REFRESH_TOKEN_EXPIRED]:
    '로그인 시간이 만료되었습니다. 다시 로그인해 주세요.',
  [ERROR_CODES.SESSION_INVALID]:
    '유효하지 않은 로그인 상태입니다. 다시 로그인해 주세요.',
  [ERROR_CODES.NOT_FOUND]: '요청한 정보를 찾을 수 없습니다.',
  [ERROR_CODES.CONFLICT]: '이미 처리된 요청이거나 중복된 데이터입니다.',
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: DEFAULT_ERROR_MESSAGE,
  [ERROR_CODES.NETWORK_ERROR]:
    '네트워크 오류가 발생했습니다. 연결 상태를 확인해 주세요.',
  [ERROR_CODES.TIMEOUT]:
    '요청 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.',
};

const REFRESHABLE_AUTH_ERRORS: string[] = [
  ERROR_CODES.TOKEN_EXPIRED,
  ERROR_CODES.UNAUTHORIZED,
];

const TERMINAL_AUTH_ERRORS: string[] = [
  ERROR_CODES.ACCESS_TOKEN_REQUIRED,
  ERROR_CODES.INVALID_TOKEN,
  ERROR_CODES.USER_NOT_FOUND,
  ERROR_CODES.REFRESH_TOKEN_NOT_FOUND,
  ERROR_CODES.REFRESH_TOKEN_REUSE_DETECTED,
  ERROR_CODES.REFRESH_TOKEN_EXPIRED,
  ERROR_CODES.SESSION_INVALID,
];

/**
 * 인증 에러 여부 확인
 */
export function isAuthError(errorCode?: string): boolean {
  if (!errorCode) return false;
  const authErrors: string[] = [
    ...REFRESHABLE_AUTH_ERRORS,
    ...TERMINAL_AUTH_ERRORS,
  ];
  return authErrors.includes(errorCode);
}

export function isRefreshableAuthError(errorCode?: string): boolean {
  if (!errorCode) return false;
  return REFRESHABLE_AUTH_ERRORS.includes(errorCode);
}

export function isTerminalAuthError(errorCode?: string): boolean {
  if (!errorCode) return false;
  return TERMINAL_AUTH_ERRORS.includes(errorCode);
}

export function getErrorMessage(error: unknown): string {
  const code = getErrorCode(error);

  return code ? ERROR_MESSAGES[code] : DEFAULT_ERROR_MESSAGE;
}

export function hasErrorCode(error: unknown, code: ErrorCode): boolean {
  return getErrorCode(error) === code;
}

export function createApiError(response: ApiResponse<unknown>): ApiError {
  if (!response || response.success) {
    const error = new Error('Invalid API error response') as ApiError;
    error.code = ERROR_CODES.INTERNAL_SERVER_ERROR;
    return error;
  }

  const errorMessage = response.error?.message || 'Unknown server error';
  const errorCode = response.error?.code || ERROR_CODES.INTERNAL_SERVER_ERROR;

  const error = new Error(errorMessage) as ApiError;
  error.code = errorCode;
  error.isAuthError = isAuthError(errorCode);
  error.requestId = response.error?.requestId;

  return error;
}

function getErrorCode(error: unknown): ErrorCode | undefined {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return undefined;
  }

  const code = error.code;

  if (
    typeof code !== 'string' ||
    !Object.prototype.hasOwnProperty.call(ERROR_MESSAGES, code)
  ) {
    return undefined;
  }

  return code as ErrorCode;
}
