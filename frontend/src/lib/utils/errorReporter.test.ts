import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ERROR_CODES } from './errorHandler';

const { captureException } = vi.hoisted(() => ({
  captureException: vi.fn(),
}));

vi.mock('@sentry/nextjs', () => ({
  captureException,
}));

import { captureSystemError } from './errorReporter';

describe('captureSystemError', () => {
  beforeEach(() => {
    captureException.mockReset();
  });

  it('서버 오류에 errorCode와 requestId를 첨부한다', () => {
    const error = Object.assign(new Error('raw server error'), {
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      requestId: 'req_test',
    });

    expect(captureSystemError(error, 'query')).toBe(true);
    expect(captureException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        tags: {
          context: 'api-error',
          source: 'query',
          errorCode: 'INTERNAL_SERVER_ERROR',
          requestId: 'req_test',
        },
        extra: {
          errorCode: 'INTERNAL_SERVER_ERROR',
          requestId: 'req_test',
        },
      }),
    );
  });

  it.each([
    ERROR_CODES.BAD_REQUEST,
    ERROR_CODES.VALIDATION_ERROR,
    ERROR_CODES.UNAUTHORIZED,
    ERROR_CODES.FORBIDDEN,
    ERROR_CODES.NOT_FOUND,
    ERROR_CODES.CONFLICT,
  ])('예상 가능한 %s 오류는 보고하지 않는다', (code) => {
    const error = Object.assign(new Error('expected error'), { code });

    expect(captureSystemError(error, 'mutation')).toBe(false);
    expect(captureException).not.toHaveBeenCalled();
  });

  it.each([ERROR_CODES.NETWORK_ERROR, 'PARSE_ERROR'])(
    'API 계층에서 이미 보고한 %s 오류는 중복 보고하지 않는다',
    (code) => {
      const error = Object.assign(new Error('already reported'), {
        code,
      });

      expect(captureSystemError(error, 'query')).toBe(false);
      expect(captureException).not.toHaveBeenCalled();
    },
  );

  it('코드 없는 예상 밖 오류는 보고한다', () => {
    const error = new Error('unexpected error');

    expect(captureSystemError(error, 'mutation')).toBe(true);
    expect(captureException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        tags: expect.objectContaining({
          errorCode: 'UNKNOWN',
          requestId: 'UNKNOWN',
        }),
      }),
    );
  });
});
