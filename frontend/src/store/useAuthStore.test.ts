import { describe, it, expect, vi, afterEach } from 'vitest';

const cookiesSetMock = vi.fn();
const cookiesRemoveMock = vi.fn();
vi.mock('js-cookie', () => ({
  default: {
    set: (...args: unknown[]) => cookiesSetMock(...args),
    remove: (...args: unknown[]) => cookiesRemoveMock(...args),
  },
}));

import { useAuthStore, guestCookieKey, guestTokenKey } from './useAuthStore';

const INITIAL_STATE = {
  userType: null,
  userId: null,
  guestAccessToken: null,
  guestSessionId: null,
  guestSessionExpiresAt: null,
  isLoggedIn: false,
};

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

describe('useAuthStore', () => {
  afterEach(() => {
    useAuthStore.setState(INITIAL_STATE);
    vi.clearAllMocks();
  });

  it('setGuestInfo를 호출하면 게스트 정보와 쿠키를 즉시 설정한다', () => {
    useAuthStore.getState().setGuestInfo({
      guest: true,
      guestSessionId: 'session-1',
      guestAccessToken: 'token-1',
      expiresAt: '2099-01-01T00:00:00.000Z',
    });

    const state = useAuthStore.getState();
    expect(state.userType).toBe('guest');
    expect(state.isLoggedIn).toBe(true);
    expect(state.guestSessionId).toBe('session-1');
    expect(state.guestAccessToken).toBe('token-1');
    expect(cookiesSetMock).toHaveBeenCalledWith(
      guestCookieKey,
      'session-1',
      expect.objectContaining({ expires: 3, path: '/' }),
    );
    expect(cookiesSetMock).toHaveBeenCalledWith(
      guestTokenKey,
      'token-1',
      expect.objectContaining({ expires: 3, path: '/' }),
    );
  });

  it('소셜 로그인 상태에서 setGuestInfo를 호출하면 userId가 초기화된다', () => {
    useAuthStore.setState({
      userType: 'social',
      userId: 'stale-user-id',
      isLoggedIn: true,
    });

    useAuthStore.getState().setGuestInfo({
      guest: true,
      guestSessionId: 'session-1',
      guestAccessToken: 'token-1',
      expiresAt: '2099-01-01T00:00:00.000Z',
    });

    const state = useAuthStore.getState();
    expect(state.userType).toBe('guest');
    expect(state.userId).toBeNull();
  });

  it('게스트 상태에서 setLogin을 호출하면 소셜 계정으로 전환되고 게스트 정보가 지워진다', async () => {
    useAuthStore.getState().setGuestInfo({
      guest: true,
      guestSessionId: 'session-1',
      guestAccessToken: 'token-1',
      expiresAt: '2099-01-01T00:00:00.000Z',
    });
    cookiesRemoveMock.mockClear();

    useAuthStore.getState().setLogin({
      id: 'user-1',
      email: 'a@test.com',
      nickname: '홍길동',
      profileImageId: null,
      createdAt: '2024-01-01T00:00:00.000Z',
    });
    await nextFrame();

    const state = useAuthStore.getState();
    expect(state.userType).toBe('social');
    expect(state.userId).toBe('user-1');
    expect(state.isLoggedIn).toBe(true);
    expect(state.guestSessionId).toBeNull();
    expect(state.guestAccessToken).toBeNull();
    expect(cookiesRemoveMock).toHaveBeenCalledWith(guestCookieKey);
  });

  it('게스트 정보가 없는 상태에서 setLogin을 호출해도 소셜 로그인 상태가 된다', async () => {
    useAuthStore.getState().setLogin({
      id: 'user-2',
      email: 'b@test.com',
      nickname: '이몽룡',
      profileImageId: null,
      createdAt: '2024-01-01T00:00:00.000Z',
    });
    await nextFrame();

    const state = useAuthStore.getState();
    expect(state.userType).toBe('social');
    expect(state.userId).toBe('user-2');
    expect(state.isLoggedIn).toBe(true);
  });

  it('setSocialLogin은 프로필 없이 로그인 상태만 설정한다', async () => {
    useAuthStore.getState().setSocialLogin();
    await nextFrame();

    const state = useAuthStore.getState();
    expect(state.userType).toBe('social');
    expect(state.isLoggedIn).toBe(true);
    expect(state.userId).toBeNull();
    expect(cookiesRemoveMock).toHaveBeenCalledWith(guestCookieKey);
  });

  it('logout을 호출하면 모든 인증 정보와 쿠키가 초기화된다', () => {
    useAuthStore.getState().setGuestInfo({
      guest: true,
      guestSessionId: 'session-1',
      guestAccessToken: 'token-1',
      expiresAt: '2099-01-01T00:00:00.000Z',
    });

    useAuthStore.getState().logout();

    expect(useAuthStore.getState()).toMatchObject(INITIAL_STATE);
    expect(cookiesRemoveMock).toHaveBeenCalledWith(guestCookieKey);
    expect(cookiesRemoveMock).toHaveBeenCalledWith(guestTokenKey);
  });
});
