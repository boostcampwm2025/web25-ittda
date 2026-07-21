import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useHaptic } from './useHaptic';

const hapticsImpactMock = vi.hoisted(() => vi.fn());
vi.mock('@capacitor/haptics', () => ({
  Haptics: { impact: hapticsImpactMock },
  ImpactStyle: { Light: 'LIGHT' },
}));

function setUserAgent(ua: string) {
  Object.defineProperty(navigator, 'userAgent', {
    value: ua,
    configurable: true,
  });
}

function setNativePlatform(isNative: boolean) {
  Object.assign(window, {
    Capacitor: { isNativePlatform: () => isNative },
  });
}

describe('useHaptic', () => {
  afterEach(() => {
    setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    document.body.innerHTML = '';
    Reflect.deleteProperty(window, 'Capacitor');
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('Capacitor 네이티브 환경이면 웹 API 대신 네이티브 Haptics.impact를 호출한다', async () => {
    setNativePlatform(true);
    const vibrateMock = vi.fn();
    Object.assign(navigator, { vibrate: vibrateMock });

    const { result } = renderHook(() => useHaptic());
    result.current.trigger();

    await waitFor(() =>
      expect(hapticsImpactMock).toHaveBeenCalledWith({ style: 'LIGHT' }),
    );
    expect(vibrateMock).not.toHaveBeenCalled();
  });

  it('iOS면 숨겨진 checkbox label을 클릭해 Taptic Engine을 발동한다', () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)');
    const { result } = renderHook(() => useHaptic());

    result.current.trigger();

    const label = document.querySelector('label[for="__haptic_trigger"]');
    expect(label).not.toBeNull();
  });

  it('iOS가 아니고 navigator.vibrate가 있으면 vibrate를 호출한다', () => {
    setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    const vibrateMock = vi.fn();
    Object.assign(navigator, { vibrate: vibrateMock });

    const { result } = renderHook(() => useHaptic());
    result.current.trigger(50);

    expect(vibrateMock).toHaveBeenCalledWith(50);
  });

  it('vibrate가 없어도 예외를 던지지 않는다', () => {
    setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    Object.assign(navigator, { vibrate: undefined });

    const { result } = renderHook(() => useHaptic());

    expect(() => result.current.trigger()).not.toThrow();
  });
});
