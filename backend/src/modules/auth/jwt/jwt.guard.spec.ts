import { HttpException, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from './jwt.guard';

interface ErrorResponse {
  code: string;
  message: string;
  details?: { reason: string };
}

describe('JwtAuthGuard', () => {
  const guard = new JwtAuthGuard();

  const getResponse = (action: () => unknown): ErrorResponse => {
    try {
      action();
      throw new Error('Expected authentication to fail');
    } catch (error) {
      if (!(error instanceof HttpException)) {
        throw error;
      }

      expect(error).toMatchObject({
        status: HttpStatus.UNAUTHORIZED,
      });

      return error.getResponse() as ErrorResponse;
    }
  };

  it('만료된 토큰을 TOKEN_EXPIRED로 구분한다', () => {
    const tokenError = new Error('jwt expired');
    tokenError.name = 'TokenExpiredError';

    const response = getResponse(() =>
      guard.handleRequest(null, false, tokenError),
    );

    expect(response).toEqual({
      code: 'TOKEN_EXPIRED',
      message: '로그인 시간이 만료되었습니다. 다시 로그인해 주세요.',
      details: { reason: 'jwt expired' },
    });
  });

  it('잘못된 토큰을 INVALID_TOKEN으로 구분한다', () => {
    const tokenError = new Error('invalid signature');
    tokenError.name = 'JsonWebTokenError';

    const response = getResponse(() =>
      guard.handleRequest(null, false, tokenError),
    );

    expect(response).toEqual({
      code: 'INVALID_TOKEN',
      message: '유효하지 않은 인증 정보입니다. 다시 로그인해 주세요.',
      details: { reason: 'invalid signature' },
    });
  });

  it('인증 정보가 없으면 UNAUTHORIZED로 처리한다', () => {
    const response = getResponse(() =>
      guard.handleRequest(null, false, new Error('No auth token')),
    );

    expect(response).toEqual({
      code: 'UNAUTHORIZED',
      message: '로그인이 필요합니다.',
      details: { reason: 'No auth token' },
    });
  });

  it('인증된 사용자는 그대로 반환한다', () => {
    const user = { sub: 'user-id' };

    expect(guard.handleRequest(null, user, undefined)).toBe(user);
  });
});
