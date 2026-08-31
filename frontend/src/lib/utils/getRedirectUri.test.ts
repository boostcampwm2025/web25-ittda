import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/config/backend', () => ({
  getBackendApiBaseUrl: () => 'https://api.example.com',
}));

import { getRedirectUri } from './getRedirectUri';

describe('getRedirectUri', () => {
  it('추가 옵션이 없으면 base URL만 반환한다', () => {
    expect(getRedirectUri({ provider: 'kakao' })).toBe(
      'https://api.example.com/auth/kakao',
    );
  });

  it('provider에 따라 경로가 달라진다', () => {
    expect(getRedirectUri({ provider: 'google' })).toBe(
      'https://api.example.com/auth/google',
    );
  });

  it('callback이 있으면 쿼리 파라미터로 추가한다', () => {
    expect(
      getRedirectUri({ provider: 'kakao', callback: '/my' }),
    ).toBe('https://api.example.com/auth/kakao?callback=%2Fmy');
  });

  it('forceAccountSelect가 true면 prompt=select_account를 추가한다', () => {
    const url = getRedirectUri({
      provider: 'google',
      forceAccountSelect: true,
    });
    expect(url).toContain('prompt=select_account');
  });

  it('mobile, android 옵션이 모두 true면 두 파라미터가 다 붙는다', () => {
    const url = getRedirectUri({
      provider: 'kakao',
      mobile: true,
      android: true,
    });
    expect(url).toContain('mobile=true');
    expect(url).toContain('android=true');
  });
});
