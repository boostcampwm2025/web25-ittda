import { describe, it, expect } from 'vitest';
import {
  isAuthError,
  isRefreshableAuthError,
  isTerminalAuthError,
  getErrorMessage,
  createApiError,
  ERROR_CODES,
} from './errorHandler';
import type { ApiResponse } from '../types/response';

describe('isAuthError', () => {
  it('TOKEN_EXPIRED는 인증 에러다', () => {
    expect(isAuthError(ERROR_CODES.TOKEN_EXPIRED)).toBe(true);
  });

  it('INVALID_TOKEN은 인증 에러다', () => {
    expect(isAuthError(ERROR_CODES.INVALID_TOKEN)).toBe(true);
  });

  it('UNAUTHORIZED는 인증 에러다', () => {
    expect(isAuthError(ERROR_CODES.UNAUTHORIZED)).toBe(true);
  });

  it('NETWORK_ERROR는 인증 에러가 아니다', () => {
    expect(isAuthError(ERROR_CODES.NETWORK_ERROR)).toBe(false);
  });

  it('알 수 없는 에러 코드는 인증 에러가 아니다', () => {
    expect(isAuthError('SOME_OTHER_ERROR')).toBe(false);
  });

  it('undefined이면 인증 에러가 아니다', () => {
    expect(isAuthError(undefined)).toBe(false);
  });
});

describe('isRefreshableAuthError', () => {
  it('TOKEN_EXPIRED는 재발급 가능한 인증 에러다', () => {
    expect(isRefreshableAuthError(ERROR_CODES.TOKEN_EXPIRED)).toBe(true);
  });

  it('UNAUTHORIZED는 재발급 가능한 인증 에러다', () => {
    expect(isRefreshableAuthError(ERROR_CODES.UNAUTHORIZED)).toBe(true);
  });

  it('INVALID_TOKEN은 재발급 가능한 인증 에러가 아니다', () => {
    expect(isRefreshableAuthError(ERROR_CODES.INVALID_TOKEN)).toBe(false);
  });

  it('undefined이면 재발급 가능한 인증 에러가 아니다', () => {
    expect(isRefreshableAuthError(undefined)).toBe(false);
  });
});

describe('isTerminalAuthError', () => {
  it('INVALID_TOKEN은 종료 처리해야 하는 인증 에러다', () => {
    expect(isTerminalAuthError(ERROR_CODES.INVALID_TOKEN)).toBe(true);
  });

  it('SESSION_INVALID는 종료 처리해야 하는 인증 에러다', () => {
    expect(isTerminalAuthError(ERROR_CODES.SESSION_INVALID)).toBe(true);
  });

  it('TOKEN_EXPIRED는 종료 처리 대상이 아니다', () => {
    expect(isTerminalAuthError(ERROR_CODES.TOKEN_EXPIRED)).toBe(false);
  });

  it('undefined이면 종료 처리 대상이 아니다', () => {
    expect(isTerminalAuthError(undefined)).toBe(false);
  });
});

describe('getErrorMessage', () => {
  it('ApiError 객체의 message를 반환한다', () => {
    const error = { message: '토큰이 만료되었습니다.' };
    expect(getErrorMessage(error)).toBe('토큰이 만료되었습니다.');
  });

  it('Error 인스턴스의 message를 반환한다', () => {
    const error = new Error('네트워크 오류');
    expect(getErrorMessage(error)).toBe('네트워크 오류');
  });

  it('문자열 에러를 그대로 반환한다', () => {
    expect(getErrorMessage('서버 오류')).toBe('서버 오류');
  });

  it('null이면 기본 메시지를 반환한다', () => {
    expect(getErrorMessage(null)).toBe('알 수 없는 오류가 발생했습니다.');
  });

  it('undefined이면 기본 메시지를 반환한다', () => {
    expect(getErrorMessage(undefined)).toBe('알 수 없는 오류가 발생했습니다.');
  });

  it('빈 메시지 객체이면 기본 메시지를 반환한다', () => {
    expect(getErrorMessage({ message: '   ' })).toBe(
      '알 수 없는 오류가 발생했습니다.',
    );
  });

  it('빈 문자열이면 기본 메시지를 반환한다', () => {
    expect(getErrorMessage('')).toBe('알 수 없는 오류가 발생했습니다.');
  });
});

describe('createApiError', () => {
  it('에러 응답에서 에러 객체를 생성한다', () => {
    const response: ApiResponse<unknown> = {
      success: false,
      error: { message: '권한이 없습니다.', code: 'UNAUTHORIZED' },
    };
    const error = createApiError(response);

    expect(error.message).toBe('권한이 없습니다.');
    expect(error.code).toBe('UNAUTHORIZED');
    expect(error.isAuthError).toBe(true);
  });

  it('NETWORK_ERROR 코드이면 isAuthError가 false다', () => {
    const response: ApiResponse<unknown> = {
      success: false,
      error: { message: '네트워크 오류', code: 'NETWORK_ERROR' },
    };
    const error = createApiError(response);

    expect(error.isAuthError).toBe(false);
  });

  it('success 응답이 들어오면 기본 에러를 반환한다', () => {
    const response: ApiResponse<unknown> = {
      success: true,
      data: {},
    };
    const error = createApiError(response);

    expect(error.message).toBe('알 수 없는 서버 응답입니다.');
  });

  it('에러 코드가 없으면 INTERNAL_SERVER_ERROR로 설정된다', () => {
    const response: ApiResponse<unknown> = {
      success: false,
      error: { message: '서버 오류' },
    };
    const error = createApiError(response);

    expect(error.code).toBe('INTERNAL_SERVER_ERROR');
  });
});
