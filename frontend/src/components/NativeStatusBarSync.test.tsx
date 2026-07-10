import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import NativeStatusBarSync from './NativeStatusBarSync';

// 이 컴포넌트는 항상 null을 렌더링하는 순수 사이드이펙트 컴포넌트라
// Storybook으로 보여줄 화면이 없다 — 네이티브 브릿지 호출 여부를 검증하는
// 유닛 테스트로만 커버 가능하다.

const mockUsePathname = vi.hoisted(() => vi.fn());
const mockUseTheme = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  usePathname: mockUsePathname,
}));

vi.mock('next-themes', () => ({
  useTheme: mockUseTheme,
}));

function setup({ pathname = '/', resolvedTheme = 'light' as string | undefined } = {}) {
  mockUsePathname.mockReturnValue(pathname);
  mockUseTheme.mockReturnValue({ resolvedTheme });
}

describe('NativeStatusBarSync', () => {
  let postMessage: ReturnType<typeof vi.fn>;
  let androidThemeChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    postMessage = vi.fn();
    androidThemeChange = vi.fn();
    (window as unknown as { webkit: unknown }).webkit = {
      messageHandlers: { themeChange: { postMessage } },
    };
    (window as unknown as { AndroidBridge: unknown }).AndroidBridge = {
      themeChange: androidThemeChange,
    };
  });

  afterEach(() => {
    cleanup();
    delete (window as unknown as { webkit?: unknown }).webkit;
    delete (window as unknown as { AndroidBridge?: unknown }).AndroidBridge;
    document.body.innerHTML = '';
  });

  it('아무것도 렌더링하지 않는다', () => {
    setup();
    const { container } = render(<NativeStatusBarSync />);
    expect(container).toBeEmptyDOMElement();
  });

  it('일반 페이지 + light 테마면 light를 iOS/Android 양쪽에 전송한다', () => {
    setup({ pathname: '/', resolvedTheme: 'light' });
    render(<NativeStatusBarSync />);

    expect(postMessage).toHaveBeenCalledWith('light');
    expect(androidThemeChange).toHaveBeenCalledWith('light');
  });

  it('dark 테마면 dark를 전송한다', () => {
    setup({ resolvedTheme: 'dark' });
    render(<NativeStatusBarSync />);

    expect(postMessage).toHaveBeenCalledWith('dark');
  });

  it('경로에 map이 포함되면 테마와 무관하게 transparent를 전송한다', () => {
    setup({ pathname: '/map', resolvedTheme: 'dark' });
    render(<NativeStatusBarSync />);

    expect(postMessage).toHaveBeenCalledWith('transparent');
  });

  it('resolvedTheme이 아직 없으면(undefined) 아무것도 전송하지 않는다', () => {
    mockUsePathname.mockReturnValue('/');
    mockUseTheme.mockReturnValue({ resolvedTheme: undefined });
    render(<NativeStatusBarSync />);

    expect(postMessage).not.toHaveBeenCalled();
    expect(androidThemeChange).not.toHaveBeenCalled();
  });

  it('마운트 시점에 이미 drawer가 열려 있으면 초기 전송을 건너뛴다', () => {
    setup();
    const overlay = document.createElement('div');
    overlay.setAttribute('data-slot', 'drawer-overlay');
    overlay.setAttribute('data-state', 'open');
    document.body.appendChild(overlay);

    render(<NativeStatusBarSync />);

    expect(postMessage).not.toHaveBeenCalled();
  });

  it('drawer overlay가 열리면 transparent를, 닫히면 기본 테마로 복원해 전송한다', async () => {
    setup({ resolvedTheme: 'dark' });
    render(<NativeStatusBarSync />);
    expect(postMessage).toHaveBeenLastCalledWith('dark');

    const overlay = document.createElement('div');
    overlay.setAttribute('data-slot', 'drawer-overlay');
    overlay.setAttribute('data-state', 'open');

    await act(async () => {
      document.body.appendChild(overlay);
      await Promise.resolve();
    });
    expect(postMessage).toHaveBeenLastCalledWith('transparent');

    await act(async () => {
      overlay.setAttribute('data-state', 'closed');
      await Promise.resolve();
    });
    expect(postMessage).toHaveBeenLastCalledWith('dark');
  });

  it('언마운트되면 MutationObserver를 해제해 더 이상 전송하지 않는다', async () => {
    setup();
    const { unmount } = render(<NativeStatusBarSync />);
    postMessage.mockClear();

    unmount();

    const overlay = document.createElement('div');
    overlay.setAttribute('data-slot', 'drawer-overlay');
    overlay.setAttribute('data-state', 'open');
    await act(async () => {
      document.body.appendChild(overlay);
      await Promise.resolve();
    });

    expect(postMessage).not.toHaveBeenCalled();
  });
});
