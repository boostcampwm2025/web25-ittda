import { describe, expect, it } from 'vitest';
import {
  createApiError,
  ERROR_CODES,
  getErrorMessage,
  hasErrorCode,
  isRefreshableAuthError,
  isTerminalAuthError,
} from './errorHandler';
import type { ErrorResponse } from '../types/response';

describe('errorHandler', () => {
  it('알려진 code를 사용자용 메시지로 변환한다', () => {
    const error = new Error('raw backend message');
    Object.assign(error, { code: ERROR_CODES.FORBIDDEN });

    expect(getErrorMessage(error)).toBe('이 작업을 수행할 권한이 없습니다.');
  });

  it('알 수 없는 code의 원본 메시지를 노출하지 않는다', () => {
    const error = new Error('password=secret');
    Object.assign(error, { code: 'DATABASE_CONNECTION_FAILED' });

    expect(getErrorMessage(error)).toBe(
      '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    );
  });

  it('code가 없는 Error와 문자열의 원문을 노출하지 않는다', () => {
    expect(getErrorMessage(new Error('raw library error'))).toBe(
      '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    );
    expect(getErrorMessage('raw string error')).toBe(
      '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    );
  });

  it('원본 메시지와 requestId를 추적용 ApiError에 유지한다', () => {
    const response: ErrorResponse = {
      success: false,
      data: null,
      error: {
        code: ERROR_CODES.CONFLICT,
        message: 'duplicate key value violates unique constraint',
        requestId: 'req_test',
      },
    };

    const error = createApiError(response);

    expect(error.message).toBe(
      'duplicate key value violates unique constraint',
    );
    expect(error.requestId).toBe('req_test');
    expect(getErrorMessage(error)).toBe(
      '이미 처리된 요청이거나 중복된 데이터입니다.',
    );
  });

  it('기존 인증 복구 분류를 유지한다', () => {
    expect(isRefreshableAuthError(ERROR_CODES.TOKEN_EXPIRED)).toBe(true);
    expect(isRefreshableAuthError(ERROR_CODES.UNAUTHORIZED)).toBe(true);
    expect(isTerminalAuthError(ERROR_CODES.REFRESH_TOKEN_EXPIRED)).toBe(true);
    expect(isTerminalAuthError(ERROR_CODES.REFRESH_TOKEN_REUSE_DETECTED)).toBe(
      true,
    );
    expect(isTerminalAuthError(ERROR_CODES.SESSION_INVALID)).toBe(true);
    expect(isRefreshableAuthError(ERROR_CODES.INVALID_TOKEN)).toBe(false);
  });

  it('message가 아닌 code로 에러 종류를 판별한다', () => {
    const error = Object.assign(new Error('unexpected raw message'), {
      code: ERROR_CODES.NOT_FOUND,
    });

    expect(hasErrorCode(error, ERROR_CODES.NOT_FOUND)).toBe(true);
    expect(hasErrorCode(error, ERROR_CODES.CONFLICT)).toBe(false);
    expect(
      hasErrorCode(new Error('Draft not found'), ERROR_CODES.NOT_FOUND),
    ).toBe(false);
  });
});
