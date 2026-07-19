import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const getMock = vi.fn();
const postMock = vi.fn();
vi.mock('@/lib/api/api', () => ({
  get: (...args: unknown[]) => getMock(...args),
  post: (...args: unknown[]) => postMock(...args),
}));

import { useMediaResolveSingle, useMediaResolveMulti } from './useMediaResolve';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }
  return Wrapper;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('useMediaResolveSingle', () => {
  it('mediaId가 없으면 요청하지 않는다', () => {
    const { result } = renderHook(() => useMediaResolveSingle(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getMock).not.toHaveBeenCalled();
  });

  it('mediaId가 있으면 URL을 조회해 반환한다', async () => {
    getMock.mockResolvedValue({
      success: true,
      data: { url: 'https://cdn/m1.png', expiresAt: '2099-01-01' },
    });

    const { result } = renderHook(() => useMediaResolveSingle('m1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.url).toBe('https://cdn/m1.png');
    expect(getMock).toHaveBeenCalledWith('/api/media/m1/url');
  });

  it('응답이 실패면 에러 상태가 된다', async () => {
    getMock.mockResolvedValue({
      success: false,
      error: { code: 'NOT_FOUND', message: '미디어 없음' },
    });

    const { result } = renderHook(() => useMediaResolveSingle('m1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useMediaResolveMulti', () => {
  it('mediaIds가 비어있으면 요청하지 않는다', () => {
    const { result } = renderHook(() => useMediaResolveMulti([]), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(postMock).not.toHaveBeenCalled();
  });

  it('성공하면 items/failed를 그대로 반환한다', async () => {
    postMock.mockResolvedValue({
      success: true,
      data: { items: [{ mediaId: 'm1', url: 'u1', expiresAt: 'x' }], failed: [] },
    });

    const { result } = renderHook(() => useMediaResolveMulti(['m1']), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(1);
    expect(postMock).toHaveBeenCalledWith('/api/media/resolve', {
      draftId: undefined,
      mediaIds: ['m1'],
    });
  });

  it('draft 모드에서 일부 실패해도 부분 결과를 반환한다(에러로 처리하지 않음)', async () => {
    postMock.mockResolvedValue({
      success: true,
      data: { items: [{ mediaId: 'm1', url: 'u1', expiresAt: 'x' }], failed: ['m2'] },
    });

    const { result } = renderHook(
      () => useMediaResolveMulti(['m1', 'm2'], 'draft-1'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.failed).toEqual(['m2']);
  });
});
