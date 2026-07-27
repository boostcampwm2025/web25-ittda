import { UnauthorizedException } from '@nestjs/common';

export const AUTH_ERROR_CODES = {
  ACCESS_TOKEN_REQUIRED: 'ACCESS_TOKEN_REQUIRED',
  INVALID_AUTH_CODE: 'INVALID_AUTH_CODE',
  UNAUTHORIZED: 'UNAUTHORIZED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  REFRESH_TOKEN_NOT_FOUND: 'REFRESH_TOKEN_NOT_FOUND',
  REFRESH_TOKEN_REUSE_DETECTED: 'REFRESH_TOKEN_REUSE_DETECTED',
  REFRESH_TOKEN_EXPIRED: 'REFRESH_TOKEN_EXPIRED',
  SESSION_INVALID: 'SESSION_INVALID',
} as const;

export type AuthErrorCode =
  (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];

const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  [AUTH_ERROR_CODES.ACCESS_TOKEN_REQUIRED]: '로그인이 필요합니다.',
  [AUTH_ERROR_CODES.INVALID_AUTH_CODE]:
    '유효하지 않거나 만료된 인증 요청입니다. 다시 로그인해 주세요.',
  [AUTH_ERROR_CODES.UNAUTHORIZED]: '로그인이 필요합니다.',
  [AUTH_ERROR_CODES.TOKEN_EXPIRED]:
    '로그인 시간이 만료되었습니다. 다시 로그인해 주세요.',
  [AUTH_ERROR_CODES.INVALID_TOKEN]:
    '유효하지 않은 인증 정보입니다. 다시 로그인해 주세요.',
  [AUTH_ERROR_CODES.USER_NOT_FOUND]:
    '사용자 정보를 확인할 수 없습니다. 다시 로그인해 주세요.',
  [AUTH_ERROR_CODES.REFRESH_TOKEN_NOT_FOUND]:
    '로그인 정보가 없습니다. 다시 로그인해 주세요.',
  [AUTH_ERROR_CODES.REFRESH_TOKEN_REUSE_DETECTED]:
    '로그인 정보가 유효하지 않습니다. 다시 로그인해 주세요.',
  [AUTH_ERROR_CODES.REFRESH_TOKEN_EXPIRED]:
    '로그인 시간이 만료되었습니다. 다시 로그인해 주세요.',
  [AUTH_ERROR_CODES.SESSION_INVALID]:
    '유효하지 않은 로그인 상태입니다. 다시 로그인해 주세요.',
};

export class AuthUnauthorizedException extends UnauthorizedException {
  constructor(code: AuthErrorCode, reason?: string) {
    super({
      code,
      message: AUTH_ERROR_MESSAGES[code],
      ...(reason ? { details: { reason } } : {}),
    });
  }
}
