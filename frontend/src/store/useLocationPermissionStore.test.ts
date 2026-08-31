import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useLocationPermissionStore } from './useLocationPermissionStore';

describe('canShowToast', () => {
  beforeEach(() => {
    useLocationPermissionStore.setState({
      permissionStatus: 'unknown',
      hasAskedPermission: false,
      lastToastShownAt: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('lastToastShownAt이 null이면 토스트를 표시할 수 있다', () => {
    const { canShowToast } = useLocationPermissionStore.getState();
    expect(canShowToast()).toBe(true);
  });

  it('24시간이 지나지 않았으면 토스트를 표시하지 않는다', () => {
    vi.useFakeTimers();
    const now = new Date('2024-06-15T12:00:00').getTime();
    vi.setSystemTime(now);

    useLocationPermissionStore.setState({
      lastToastShownAt: now - 23 * 60 * 60 * 1000, // 23시간 전
    });

    const { canShowToast } = useLocationPermissionStore.getState();
    expect(canShowToast()).toBe(false);
  });

  it('정확히 24시간이 지났으면 토스트를 표시할 수 있다', () => {
    vi.useFakeTimers();
    const now = new Date('2024-06-15T12:00:00').getTime();
    vi.setSystemTime(now);

    useLocationPermissionStore.setState({
      lastToastShownAt: now - 24 * 60 * 60 * 1000, // 정확히 24시간 전
    });

    const { canShowToast } = useLocationPermissionStore.getState();
    expect(canShowToast()).toBe(true);
  });

  it('24시간 이상 지났으면 토스트를 표시할 수 있다', () => {
    vi.useFakeTimers();
    const now = new Date('2024-06-15T12:00:00').getTime();
    vi.setSystemTime(now);

    useLocationPermissionStore.setState({
      lastToastShownAt: now - 25 * 60 * 60 * 1000, // 25시간 전
    });

    const { canShowToast } = useLocationPermissionStore.getState();
    expect(canShowToast()).toBe(true);
  });
});

describe('setPermissionStatus', () => {
  beforeEach(() => {
    useLocationPermissionStore.setState({ permissionStatus: 'unknown' });
  });

  it('권한 상태를 변경한다', () => {
    useLocationPermissionStore.getState().setPermissionStatus('granted');
    expect(useLocationPermissionStore.getState().permissionStatus).toBe('granted');
  });

  it('denied 상태로 변경한다', () => {
    useLocationPermissionStore.getState().setPermissionStatus('denied');
    expect(useLocationPermissionStore.getState().permissionStatus).toBe('denied');
  });
});

describe('setHasAskedPermission', () => {
  beforeEach(() => {
    useLocationPermissionStore.setState({ hasAskedPermission: false });
  });

  it('hasAskedPermission을 true로 변경한다', () => {
    useLocationPermissionStore.getState().setHasAskedPermission(true);
    expect(useLocationPermissionStore.getState().hasAskedPermission).toBe(true);
  });
});

describe('setLastToastShownAt', () => {
  it('lastToastShownAt을 지정한 timestamp로 변경한다', () => {
    const timestamp = Date.now();
    useLocationPermissionStore.getState().setLastToastShownAt(timestamp);
    expect(useLocationPermissionStore.getState().lastToastShownAt).toBe(timestamp);
  });
});

describe('checkPermission', () => {
  const originalPermissions = navigator.permissions;

  afterEach(() => {
    Object.defineProperty(navigator, 'permissions', {
      configurable: true,
      value: originalPermissions,
    });
    useLocationPermissionStore.setState({ permissionStatus: 'unknown' });
  });

  it('Permissions API가 없으면 unknown을 반환한다', async () => {
    Object.defineProperty(navigator, 'permissions', {
      configurable: true,
      value: undefined,
    });

    const status = await useLocationPermissionStore.getState().checkPermission();
    expect(status).toBe('unknown');
  });

  it('권한 상태를 조회해서 반환하고 스토어 상태를 갱신한다', async () => {
    Object.defineProperty(navigator, 'permissions', {
      configurable: true,
      value: { query: vi.fn().mockResolvedValue({ state: 'granted' }) },
    });

    const status = await useLocationPermissionStore.getState().checkPermission();
    expect(status).toBe('granted');
    expect(useLocationPermissionStore.getState().permissionStatus).toBe('granted');
  });

  it('query가 실패하면 unknown을 반환한다', async () => {
    Object.defineProperty(navigator, 'permissions', {
      configurable: true,
      value: { query: vi.fn().mockRejectedValue(new Error('실패')) },
    });

    const status = await useLocationPermissionStore.getState().checkPermission();
    expect(status).toBe('unknown');
  });
});

describe('requestPermission', () => {
  const originalGeolocation = navigator.geolocation;

  afterEach(() => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: originalGeolocation,
    });
    useLocationPermissionStore.setState({
      permissionStatus: 'unknown',
      hasAskedPermission: false,
    });
  });

  it('Geolocation API가 없으면 denied로 설정하고 반환한다', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: undefined,
    });

    const status = await useLocationPermissionStore.getState().requestPermission();
    expect(status).toBe('denied');
    expect(useLocationPermissionStore.getState().permissionStatus).toBe('denied');
  });

  it('위치 조회에 성공하면 granted로 설정한다', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: (success: PositionCallback) => {
          success({} as GeolocationPosition);
        },
      },
    });

    const status = await useLocationPermissionStore.getState().requestPermission();
    expect(status).toBe('granted');
    expect(useLocationPermissionStore.getState().hasAskedPermission).toBe(true);
  });

  it('사용자가 권한을 거부하면 denied로 설정한다', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: (
          _success: PositionCallback,
          error: PositionErrorCallback,
        ) => {
          error({ code: 1, PERMISSION_DENIED: 1 } as GeolocationPositionError);
        },
      },
    });

    const status = await useLocationPermissionStore.getState().requestPermission();
    expect(status).toBe('denied');
    expect(useLocationPermissionStore.getState().hasAskedPermission).toBe(true);
  });

  it('권한 외 에러(타임아웃 등)는 기존 permissionStatus를 유지하고 hasAskedPermission만 true로 설정한다', async () => {
    useLocationPermissionStore.setState({ permissionStatus: 'unknown' });

    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: (
          _success: PositionCallback,
          error: PositionErrorCallback,
        ) => {
          error({ code: 3, PERMISSION_DENIED: 1 } as GeolocationPositionError);
        },
      },
    });

    const status = await useLocationPermissionStore.getState().requestPermission();
    expect(status).toBe('unknown');
    expect(useLocationPermissionStore.getState().hasAskedPermission).toBe(true);
  });
});
