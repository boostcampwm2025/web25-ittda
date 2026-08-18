import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const registerFcmTokenMock = vi.hoisted(() => vi.fn());
vi.mock('@/lib/api/notification', () => ({
  registerFcmToken: registerFcmTokenMock,
}));

type Listener = (data: unknown) => void | Promise<void>;

const pushNotifications = vi.hoisted(() => ({
  requestPermissions: vi.fn(),
  addListener: vi.fn(),
  register: vi.fn(),
}));

vi.mock('@capacitor/push-notifications', () => ({
  PushNotifications: pushNotifications,
}));

const onMessageMock = vi.hoisted(() => vi.fn());
vi.mock('firebase/messaging', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/messaging')>();
  return { ...actual, onMessage: onMessageMock };
});

const getFirebaseMessagingMock = vi.hoisted(() => vi.fn());
vi.mock('@/lib/firebase', () => ({
  getFirebaseMessaging: getFirebaseMessagingMock,
}));

import {
  registerAndroidToken,
  usePushNotification,
} from './usePushNotification';

type Handle = { remove: ReturnType<typeof vi.fn> };

function captureListeners() {
  const listeners: Record<string, Listener> = {};
  const handles: Record<string, Handle> = {};
  pushNotifications.addListener.mockImplementation(
    (event: string, cb: Listener) => {
      listeners[event] = cb;
      const handle: Handle = { remove: vi.fn().mockResolvedValue(undefined) };
      handles[event] = handle;
      return Promise.resolve(handle);
    },
  );
  return { listeners, handles };
}

describe('registerAndroidToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerFcmTokenMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('권한이 거부되면 리스너 등록 없이 종료하고 false를 반환한다', async () => {
    pushNotifications.requestPermissions.mockResolvedValue({
      receive: 'denied',
    });

    const result = await registerAndroidToken();

    expect(result).toBe(false);
    expect(pushNotifications.register).not.toHaveBeenCalled();
    expect(pushNotifications.addListener).not.toHaveBeenCalled();
  });

  it('registration 이벤트가 오면 토큰을 등록하고 자신의 리스너만 정리한 뒤 true를 반환한다', async () => {
    pushNotifications.requestPermissions.mockResolvedValue({
      receive: 'granted',
    });
    const { listeners, handles } = captureListeners();

    const promise = registerAndroidToken();
    await vi.waitFor(() =>
      expect(listeners.registration).toBeTypeOf('function'),
    );
    await listeners.registration({ value: 'token-1' });
    const result = await promise;

    expect(result).toBe(true);
    expect(registerFcmTokenMock).toHaveBeenCalledWith('token-1', 'android');
    // 플러그인 전체가 아니라 이 함수가 등록한 두 리스너의 핸들만 정리해야
    // AndroidNotificationHandler의 pushNotificationReceived 리스너가 살아있다.
    expect(handles.registration.remove).toHaveBeenCalled();
    expect(handles.registrationError.remove).toHaveBeenCalled();
  });

  // 회귀 테스트: registerFcmToken이 실패해도 registration 리스너가 이를 삼켜서
  // 항상 성공한 것처럼 보였다 — 이제 실패가 반환값(false)으로 전파된다.
  it('registerFcmToken이 실패하면 false를 반환한다', async () => {
    pushNotifications.requestPermissions.mockResolvedValue({
      receive: 'granted',
    });
    registerFcmTokenMock.mockRejectedValue(new Error('network error'));
    const { listeners, handles } = captureListeners();

    const promise = registerAndroidToken();
    await vi.waitFor(() =>
      expect(listeners.registration).toBeTypeOf('function'),
    );
    await listeners.registration({ value: 'token-1' });
    const result = await promise;

    expect(result).toBe(false);
    expect(handles.registration.remove).toHaveBeenCalled();
    expect(handles.registrationError.remove).toHaveBeenCalled();
  });

  it('registrationError가 오면 토큰 등록 없이 자신의 리스너만 정리하고 false를 반환한다', async () => {
    pushNotifications.requestPermissions.mockResolvedValue({
      receive: 'granted',
    });
    const { listeners, handles } = captureListeners();

    const promise = registerAndroidToken();
    await vi.waitFor(() =>
      expect(listeners.registrationError).toBeTypeOf('function'),
    );
    await listeners.registrationError({});
    const result = await promise;

    expect(result).toBe(false);
    expect(registerFcmTokenMock).not.toHaveBeenCalled();
    expect(handles.registration.remove).toHaveBeenCalled();
    expect(handles.registrationError.remove).toHaveBeenCalled();
  });

  // 회귀 테스트: registration/registrationError가 끝까지 안 오면 예전엔 Promise가
  // 영원히 대기해서 리스너가 계속 쌓였다 — 이제 10초 타임아웃으로 강제 정리된다.
  it('아무 이벤트도 안 오면 10초 후 타임아웃으로 자신의 리스너를 정리하고 false를 반환한다', async () => {
    vi.useFakeTimers();
    pushNotifications.requestPermissions.mockResolvedValue({
      receive: 'granted',
    });
    const { handles } = captureListeners();

    const promise = registerAndroidToken();
    await vi.advanceTimersByTimeAsync(10000);
    const result = await promise;

    expect(result).toBe(false);
    expect(registerFcmTokenMock).not.toHaveBeenCalled();
    expect(handles.registration.remove).toHaveBeenCalled();
    expect(handles.registrationError.remove).toHaveBeenCalled();
  });

  // 회귀 테스트: addListener 자체가 reject하면 예전엔 아무도 안 잡아서
  // unhandled rejection이 됐다 — 이제 실패로 확정되어 false를 반환한다.
  it('리스너 등록 자체가 실패하면 false를 반환하고 register()를 호출하지 않는다', async () => {
    pushNotifications.requestPermissions.mockResolvedValue({
      receive: 'granted',
    });
    pushNotifications.addListener.mockRejectedValue(new Error('setup failed'));

    const result = await registerAndroidToken();

    expect(result).toBe(false);
    expect(pushNotifications.register).not.toHaveBeenCalled();
  });

  // 회귀 테스트: register()가 reject하면 예전엔 아무도 안 잡아서
  // unhandled rejection이 됐다 — 이제 실패로 확정되고 이미 붙인 리스너도 정리된다.
  it('register() 호출이 실패하면 false를 반환하고 이미 등록한 리스너를 정리한다', async () => {
    pushNotifications.requestPermissions.mockResolvedValue({
      receive: 'granted',
    });
    const { handles } = captureListeners();
    pushNotifications.register.mockRejectedValue(
      new Error('native register failed'),
    );

    const result = await registerAndroidToken();

    expect(result).toBe(false);
    expect(handles.registration.remove).toHaveBeenCalled();
    expect(handles.registrationError.remove).toHaveBeenCalled();
  });

  // 회귀 테스트: 타임아웃이 먼저 확정된 뒤 addListener('registration')가 뒤늦게
  // resolve되면, 예전엔 그 handle로 registrationError까지 마저 등록하고
  // register()를 호출해버렸다(이미 false를 반환한 뒤인데도). 이제는 늦게 도착한
  // handle을 즉시 제거하고 이후 단계로 진행하지 않는다.
  it('타임아웃 확정 후 뒤늦게 도착한 handle은 즉시 제거하고 register()를 호출하지 않는다', async () => {
    vi.useFakeTimers();
    pushNotifications.requestPermissions.mockResolvedValue({
      receive: 'granted',
    });

    const lateHandle: Handle = { remove: vi.fn().mockResolvedValue(undefined) };
    let resolveSetup!: (handle: Handle) => void;
    pushNotifications.addListener.mockImplementation(
      () =>
        new Promise<Handle>((resolve) => {
          resolveSetup = resolve;
        }),
    );

    const promise = registerAndroidToken();
    await vi.advanceTimersByTimeAsync(10000);
    const result = await promise;

    expect(result).toBe(false);
    expect(lateHandle.remove).not.toHaveBeenCalled();

    resolveSetup(lateHandle);
    await vi.waitFor(() => expect(lateHandle.remove).toHaveBeenCalled());
    expect(pushNotifications.register).not.toHaveBeenCalled();
  });
});

describe('usePushNotification 포그라운드 알림', () => {
  const showNotification = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    onMessageMock.mockReturnValue(() => {});
    getFirebaseMessagingMock.mockResolvedValue({});

    Object.defineProperty(global, 'Notification', {
      value: { permission: 'granted', requestPermission: vi.fn() },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(global.navigator, 'serviceWorker', {
      value: {
        register: vi.fn().mockResolvedValue({
          active: true,
          pushManager: { getSubscription: vi.fn().mockResolvedValue(null) },
        }),
        getRegistration: vi.fn((scope: string) =>
          scope === '/firebase-cloud-messaging-push-scope'
            ? Promise.resolve({ showNotification })
            : Promise.resolve(undefined),
        ),
      },
      configurable: true,
      writable: true,
    });
  });

  it('enabled=true면 firebase onMessage를 구독한다', async () => {
    renderHook(() => usePushNotification(true));

    await vi.waitFor(() => expect(onMessageMock).toHaveBeenCalled());
  });

  it('enabled=false면 구독하지 않는다', () => {
    renderHook(() => usePushNotification(false));

    expect(onMessageMock).not.toHaveBeenCalled();
  });

  // 탭이 열려 있을 때 온 메시지도 firebase-messaging-sw.js의
  // onBackgroundMessage와 완전히 같은 옵션으로 표시돼야 한다(과제 요구사항:
  // 활성화/비활성화 수신 상태 통일). 옵션이 어긋나면 이 테스트가 잡아낸다.
  it('포그라운드 메시지를 받으면 SW의 onBackgroundMessage와 동일한 옵션으로 알림을 띄운다', async () => {
    renderHook(() => usePushNotification(true));
    await vi.waitFor(() => expect(onMessageMock).toHaveBeenCalled());

    const callback = onMessageMock.mock.calls[0][1] as (
      payload: unknown,
    ) => void;
    callback({
      data: {
        title: '이다 프론트',
        body: '새 기록이 작성되었습니다.',
        imageUrl: 'https://example.com/photo.png',
        groupId: 'group-1',
      },
    });

    await vi.waitFor(() => expect(showNotification).toHaveBeenCalled());
    expect(showNotification).toHaveBeenCalledWith('이다 프론트', {
      body: '새 기록이 작성되었습니다.',
      icon: 'https://example.com/photo.png',
      badge: '/web-app-icon-192x192.png',
      data: {
        title: '이다 프론트',
        body: '새 기록이 작성되었습니다.',
        imageUrl: 'https://example.com/photo.png',
        groupId: 'group-1',
      },
    });
  });

  it('imageUrl이 없으면 기본 앱 아이콘으로 대체한다', async () => {
    renderHook(() => usePushNotification(true));
    await vi.waitFor(() => expect(onMessageMock).toHaveBeenCalled());

    const callback = onMessageMock.mock.calls[0][1] as (
      payload: unknown,
    ) => void;
    callback({ data: { title: '이다 프론트', body: '본문' } });

    await vi.waitFor(() => expect(showNotification).toHaveBeenCalled());
    expect(showNotification).toHaveBeenCalledWith(
      '이다 프론트',
      expect.objectContaining({ icon: '/web-app-icon-192x192.png' }),
    );
  });
});
