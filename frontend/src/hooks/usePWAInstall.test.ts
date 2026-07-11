import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const toastErrorMock = vi.fn();
vi.mock('sonner', () => ({
  toast: { error: (...args: unknown[]) => toastErrorMock(...args) },
}));

const captureExceptionMock = vi.fn();
vi.mock('@sentry/nextjs', () => ({
  captureException: (...args: unknown[]) => captureExceptionMock(...args),
}));

import { usePWAInstall } from './usePWAInstall';

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({ matches }),
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  Object.assign(window, { Capacitor: undefined });
  captureExceptionMock.mockClear();
  toastErrorMock.mockClear();
});

describe('usePWAInstall', () => {
  it('Capacitor 네이티브 앱이면 설치됨으로 판단한다', async () => {
    stubMatchMedia(false);
    Object.assign(window, {
      Capacitor: { isNativePlatform: () => true },
    });

    const { result } = renderHook(() => usePWAInstall());

    await waitFor(() => expect(result.current.isCheckComplete).toBe(true));
    expect(result.current.isInstalled).toBe(true);
  });

  it('display-mode: standalone이면 설치됨으로 판단한다', async () => {
    stubMatchMedia(true);

    const { result } = renderHook(() => usePWAInstall());

    await waitFor(() => expect(result.current.isCheckComplete).toBe(true));
    expect(result.current.isInstalled).toBe(true);
  });

  it('설치되지 않았으면 isInstalled는 false로 유지된다', async () => {
    stubMatchMedia(false);

    const { result } = renderHook(() => usePWAInstall());

    await waitFor(() => expect(result.current.isCheckComplete).toBe(true));
    expect(result.current.isInstalled).toBe(false);
  });

  it('beforeinstallprompt 이벤트를 받으면 deferredPrompt에 저장한다', async () => {
    stubMatchMedia(false);
    const { result } = renderHook(() => usePWAInstall());
    await waitFor(() => expect(result.current.isCheckComplete).toBe(true));

    const promptEvent = new Event('beforeinstallprompt') as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: string }>;
    };
    promptEvent.prompt = vi.fn().mockResolvedValue(undefined);
    promptEvent.userChoice = Promise.resolve({ outcome: 'accepted' });

    act(() => {
      window.dispatchEvent(promptEvent);
    });

    await waitFor(() => expect(result.current.deferredPrompt).not.toBeNull());
  });

  it('promptInstall 호출 시 accepted면 isInstalled가 true가 된다', async () => {
    stubMatchMedia(false);
    const { result } = renderHook(() => usePWAInstall());
    await waitFor(() => expect(result.current.isCheckComplete).toBe(true));

    const promptEvent = new Event('beforeinstallprompt') as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: string }>;
    };
    promptEvent.prompt = vi.fn().mockResolvedValue(undefined);
    promptEvent.userChoice = Promise.resolve({ outcome: 'accepted' });

    act(() => {
      window.dispatchEvent(promptEvent);
    });
    await waitFor(() => expect(result.current.deferredPrompt).not.toBeNull());

    let outcome: string | null = null;
    await act(async () => {
      outcome = await result.current.promptInstall();
    });

    expect(outcome).toBe('accepted');
    expect(result.current.isInstalled).toBe(true);
    expect(result.current.deferredPrompt).toBeNull();
  });

  it('deferredPrompt가 없으면 promptInstall은 null을 반환한다', async () => {
    stubMatchMedia(false);
    const { result } = renderHook(() => usePWAInstall());
    await waitFor(() => expect(result.current.isCheckComplete).toBe(true));

    const outcome = await result.current.promptInstall();
    expect(outcome).toBeNull();
  });

  it('prompt 호출이 실패하면 에러 토스트를 띄우고 error를 반환한다', async () => {
    stubMatchMedia(false);
    const { result } = renderHook(() => usePWAInstall());
    await waitFor(() => expect(result.current.isCheckComplete).toBe(true));

    const promptEvent = new Event('beforeinstallprompt') as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: string }>;
    };
    promptEvent.prompt = vi.fn().mockRejectedValue(new Error('설치 실패'));
    promptEvent.userChoice = Promise.resolve({ outcome: 'dismissed' });

    act(() => {
      window.dispatchEvent(promptEvent);
    });
    await waitFor(() => expect(result.current.deferredPrompt).not.toBeNull());

    let outcome: string | null = null;
    await act(async () => {
      outcome = await result.current.promptInstall();
    });

    expect(outcome).toBe('error');
    expect(toastErrorMock).toHaveBeenCalled();
  });

  it('iOS Safari UA를 올바르게 감지한다', async () => {
    Object.defineProperty(navigator, 'userAgent', {
      value:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      configurable: true,
    });
    stubMatchMedia(false);

    const { result } = renderHook(() => usePWAInstall());
    await waitFor(() => expect(result.current.isCheckComplete).toBe(true));

    expect(result.current.isIOS).toBe(true);
    expect(result.current.isSafari).toBe(true);
  });
});
