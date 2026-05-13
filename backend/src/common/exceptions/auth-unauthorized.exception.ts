import { UnauthorizedException } from '@nestjs/common';

export const AUTH_ERROR_CODES = {
  ACCESS_TOKEN_REQUIRED: 'ACCESS_TOKEN_REQUIRED',
  INVALID_AUTH_CODE: 'INVALID_AUTH_CODE',
  INVALID_TOKEN: 'INVALID_TOKEN',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  REFRESH_TOKEN_NOT_FOUND: 'REFRESH_TOKEN_NOT_FOUND',
  REFRESH_TOKEN_REUSE_DETECTED: 'REFRESH_TOKEN_REUSE_DETECTED',
  REFRESH_TOKEN_EXPIRED: 'REFRESH_TOKEN_EXPIRED',
  SESSION_INVALID: 'SESSION_INVALID',
} as const;

export type AuthErrorCode =
  (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];

export class AuthUnauthorizedException extends UnauthorizedException {
  constructor(
    code: AuthErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super({
      code,
      message,
      details,
    });
  }
}
