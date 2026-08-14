import { describe, expect, it } from 'vitest';
import {
  getSocketErrorAction,
  SOCKET_ERROR_ACTIONS,
} from './socketErrorPolicy';

describe('getSocketErrorAction', () => {
  it.each(['UNAUTHORIZED', 'INVALID_TOKEN'])(
    '%s는 토큰 재발급 대상으로 분류한다',
    (code) => {
      expect(getSocketErrorAction(code)).toBe(
        SOCKET_ERROR_ACTIONS.REFRESH_AUTH,
      );
    },
  );

  it('인원 초과 오류는 사용자 안내 대상으로 분류한다', () => {
    expect(getSocketErrorAction('WS_DRAFT_FULL')).toBe(
      SOCKET_ERROR_ACTIONS.SHOW_DRAFT_FULL,
    );
  });

  it.each([
    'WS_STALE_EVENT',
    'WS_FORBIDDEN',
    'WS_LOCK_DENIED',
    'WS_SESSION_INVALID',
    'WS_NOT_FOUND',
    'WS_VALIDATION_ERROR',
  ])('%s는 기존과 같이 조용히 무시한다', (code) => {
    expect(getSocketErrorAction(code)).toBe(SOCKET_ERROR_ACTIONS.IGNORE);
  });

  it('알 수 없는 오류는 Sentry 보고 대상으로 분류한다', () => {
    expect(getSocketErrorAction('WS_INTERNAL_ERROR')).toBe(
      SOCKET_ERROR_ACTIONS.REPORT,
    );
    expect(getSocketErrorAction()).toBe(SOCKET_ERROR_ACTIONS.REPORT);
  });
});
