import {
  AUTH_ERROR_CODES,
  AuthErrorCode,
  AuthUnauthorizedException,
} from './auth-unauthorized.exception';

interface AuthErrorResponse {
  code: AuthErrorCode;
  message: string;
  details?: { reason: string };
}

describe('AuthUnauthorizedException', () => {
  it.each([
    AUTH_ERROR_CODES.INVALID_AUTH_CODE,
    AUTH_ERROR_CODES.USER_NOT_FOUND,
    AUTH_ERROR_CODES.REFRESH_TOKEN_NOT_FOUND,
    AUTH_ERROR_CODES.REFRESH_TOKEN_REUSE_DETECTED,
    AUTH_ERROR_CODES.REFRESH_TOKEN_EXPIRED,
    AUTH_ERROR_CODES.SESSION_INVALID,
  ])('복구 동작 구분을 위한 세부 코드 %s를 유지한다', (code) => {
    const exception = new AuthUnauthorizedException(code, 'internal reason');
    const response = exception.getResponse() as AuthErrorResponse;

    expect(response.code).toBe(code);
    expect(response.message).not.toBe('internal reason');
    expect(response.details).toEqual({ reason: 'internal reason' });
  });
});
