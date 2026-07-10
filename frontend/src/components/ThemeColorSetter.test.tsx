import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import ThemeColorSetter from './ThemeColorSetter';

// 항상 null을 렌더링하는 순수 사이드이펙트 컴포넌트라 Storybook으로 보여줄
// 화면이 없다 — meta 태그/네이티브 브릿지 호출 여부로 검증하는 유닛 테스트만 가능하다.

const mockUseTheme = vi.hoisted(() => vi.fn());

vi.mock('next-themes', () => ({
  useTheme: mockUseTheme,
}));

function clearMetaTags() {
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((el) => el.remove());
}

describe('ThemeColorSetter', () => {
  let postMessage: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clearMetaTags();
    postMessage = vi.fn();
    (window as unknown as { webkit: unknown }).webkit = {
      messageHandlers: { themeChange: { postMessage } },
    };
  });

  afterEach(() => {
    clearMetaTags();
    delete (window as unknown as { webkit?: unknown }).webkit;
  });

  it('아무것도 렌더링하지 않는다', () => {
    mockUseTheme.mockReturnValue({ resolvedTheme: 'light' });
    const { container } = render(<ThemeColorSetter />);
    expect(container).toBeEmptyDOMElement();
  });

  it('meta 태그가 없으면 새로 생성해 light 색상을 설정한다', async () => {
    mockUseTheme.mockReturnValue({ resolvedTheme: 'light' });
    render(<ThemeColorSetter />);

    await waitFor(() => {
      const meta = document.querySelector('meta[name="theme-color"]');
      expect(meta).not.toBeNull();
      expect(meta?.getAttribute('content')).toBe('#ffffff');
    });
  });

  it('dark 테마면 #121212로 설정한다', async () => {
    mockUseTheme.mockReturnValue({ resolvedTheme: 'dark' });
    render(<ThemeColorSetter />);

    await waitFor(() => {
      expect(
        document
          .querySelector('meta[name="theme-color"]')
          ?.getAttribute('content'),
      ).toBe('#121212');
    });
  });

  it('이미 meta 태그가 있으면 새로 만들지 않고 content만 갱신한다', async () => {
    const existing = document.createElement('meta');
    existing.name = 'theme-color';
    existing.content = '#ffffff';
    document.head.appendChild(existing);

    mockUseTheme.mockReturnValue({ resolvedTheme: 'dark' });
    render(<ThemeColorSetter />);

    await waitFor(() => {
      expect(document.querySelectorAll('meta[name="theme-color"]')).toHaveLength(1);
      expect(existing.getAttribute('content')).toBe('#121212');
    });
  });

  it('마운트 시 네이티브 브릿지로 현재 테마를 전송한다', async () => {
    mockUseTheme.mockReturnValue({ resolvedTheme: 'dark' });
    render(<ThemeColorSetter />);

    await waitFor(() => expect(postMessage).toHaveBeenCalledWith('dark'));
  });

  it('resolvedTheme이 없으면 light를 기본값으로 브릿지에 전송한다', async () => {
    mockUseTheme.mockReturnValue({ resolvedTheme: undefined });
    render(<ThemeColorSetter />);

    await waitFor(() => expect(postMessage).toHaveBeenCalledWith('light'));
  });
});
