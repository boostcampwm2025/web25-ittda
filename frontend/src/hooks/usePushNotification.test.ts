import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const registerFcmTokenMock = vi.hoisted(() => vi.fn());
vi.mock('@/lib/api/notification', () => ({
  registerFcmToken: registerFcmTokenMock,
}));

type Listener = (data: unknown) => void | Promise<void>;

const pushNotifications = vi.hoisted(() => ({
  requestPermissions: vi.fn(),
  addListener: vi.fn(),
  removeAllListeners: vi.fn(),
  register: vi.fn(),
}));

vi.mock('@capacitor/push-notifications', () => ({
  PushNotifications: pushNotifications,
}));

import { registerAndroidToken } from './usePushNotification';

function captureListeners() {
  const listeners: Record<string, Listener> = {};
  pushNotifications.addListener.mockImplementation(
    (event: string, cb: Listener) => {
      listeners[event] = cb;
    },
  );
  return listeners;
}

describe('registerAndroidToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pushNotifications.removeAllListeners.mockResolvedValue(undefined);
    registerFcmTokenMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('권한이 거부되면 리스너 등록 없이 종료한다', async () => {
    pushNotifications.requestPermissions.mockResolvedValue({
      receive: 'denied',
    });

    await registerAndroidToken();

    expect(pushNotifications.register).not.toHaveBeenCalled();
    expect(pushNotifications.addListener).not.toHaveBeenCalled();
  });

  it('registration 이벤트가 오면 토큰을 등록하고 리스너를 정리한다', async () => {
    pushNotifications.requestPermissions.mockResolvedValue({
      receive: 'granted',
    });
    const listeners = captureListeners();

    const promise = registerAndroidToken();
    await vi.waitFor(() => expect(listeners.registration).toBeTypeOf('function'));
    await listeners.registration({ value: 'token-1' });
    await promise;

    expect(registerFcmTokenMock).toHaveBeenCalledWith('token-1', 'android');
    expect(pushNotifications.removeAllListeners).toHaveBeenCalled();
  });

  it('registrationError가 오면 토큰 등록 없이 리스너를 정리한다', async () => {
    pushNotifications.requestPermissions.mockResolvedValue({
      receive: 'granted',
    });
    const listeners = captureListeners();

    const promise = registerAndroidToken();
    await vi.waitFor(() =>
      expect(listeners.registrationError).toBeTypeOf('function'),
    );
    await listeners.registrationError({});
    await promise;

    expect(registerFcmTokenMock).not.toHaveBeenCalled();
    expect(pushNotifications.removeAllListeners).toHaveBeenCalled();
  });

  // 회귀 테스트: registration/registrationError가 끝까지 안 오면 예전엔 Promise가
  // 영원히 대기해서 리스너가 계속 쌓였다 — 이제 10초 타임아웃으로 강제 정리된다.
  it('아무 이벤트도 안 오면 10초 후 타임아웃으로 리스너를 정리하고 반환한다', async () => {
    vi.useFakeTimers();
    pushNotifications.requestPermissions.mockResolvedValue({
      receive: 'granted',
    });
    captureListeners();

    const promise = registerAndroidToken();
    await vi.advanceTimersByTimeAsync(10000);
    await promise;

    expect(registerFcmTokenMock).not.toHaveBeenCalled();
    expect(pushNotifications.removeAllListeners).toHaveBeenCalled();
  });
});
