import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';

const OFFLINE_MESSAGE = '인터넷 연결을 확인해주세요';

describe('NetworkGuard', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('Capacitor Network가 연결됨을 보고하면 아무것도 렌더링하지 않는다', async () => {
    vi.doMock('@capacitor/network', () => ({
      Network: {
        getStatus: vi.fn().mockResolvedValue({ connected: true }),
        addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }),
      },
    }));

    const { default: NetworkGuard } = await import('./NetworkGuard');
    const { container } = render(<NetworkGuard />);

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it('Capacitor Network가 초기에 연결 끊김을 보고하면 오프라인 안내를 표시한다', async () => {
    vi.doMock('@capacitor/network', () => ({
      Network: {
        getStatus: vi.fn().mockResolvedValue({ connected: false }),
        addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }),
      },
    }));

    const { default: NetworkGuard } = await import('./NetworkGuard');
    render(<NetworkGuard />);

    expect(await screen.findByText(OFFLINE_MESSAGE)).toBeInTheDocument();
  });

  it('networkStatusChange 리스너가 끊김을 보고하면 오프라인 안내로 전환된다', async () => {
    let statusChangeHandler:
      | ((status: { connected: boolean }) => void)
      | undefined;

    vi.doMock('@capacitor/network', () => ({
      Network: {
        getStatus: vi.fn().mockResolvedValue({ connected: true }),
        addListener: vi.fn((_event: string, handler: typeof statusChangeHandler) => {
          statusChangeHandler = handler;
          return Promise.resolve({ remove: vi.fn() });
        }),
      },
    }));

    const { default: NetworkGuard } = await import('./NetworkGuard');
    render(<NetworkGuard />);

    await waitFor(() => expect(statusChangeHandler).toBeDefined());

    act(() => {
      statusChangeHandler!({ connected: false });
    });

    expect(await screen.findByText(OFFLINE_MESSAGE)).toBeInTheDocument();
  });

  it('Capacitor를 사용할 수 없으면 window online/offline 이벤트로 폴백한다', async () => {
    vi.doMock('@capacitor/network', () => {
      throw new Error('Capacitor 미지원 환경');
    });

    const { default: NetworkGuard } = await import('./NetworkGuard');
    render(<NetworkGuard />);

    expect(screen.queryByText(OFFLINE_MESSAGE)).toBeNull();

    // import 실패 → catch 분기에서 window 리스너를 등록하는 마이크로태스크가
    // 끝날 때까지 flush 한 뒤 이벤트를 디스패치해야 한다.
    await act(async () => {});

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(await screen.findByText(OFFLINE_MESSAGE)).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() =>
      expect(screen.queryByText(OFFLINE_MESSAGE)).toBeNull(),
    );
  });
});
