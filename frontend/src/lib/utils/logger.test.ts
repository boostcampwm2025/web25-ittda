import { describe, it, expect, vi, afterEach } from 'vitest';
import { logger } from './logger';

describe('logger.error', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('development 환경이면 console.error를 호출한다', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logger.error('문제 발생', new Error('상세 원인'));

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[ERROR] 문제 발생',
      expect.any(Error),
    );
  });

  it('development가 아니면 console.error를 호출하지 않는다', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logger.error('문제 발생');

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
