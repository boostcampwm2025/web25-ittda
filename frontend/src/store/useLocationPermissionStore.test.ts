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
