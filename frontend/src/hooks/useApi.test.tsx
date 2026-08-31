import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const getMock = vi.fn();
const postMock = vi.fn();
const putMock = vi.fn();
const delMock = vi.fn();
const patchMock = vi.fn();

vi.mock('@/lib/api/api', () => ({
  get: (...args: unknown[]) => getMock(...args),
  post: (...args: unknown[]) => postMock(...args),
  put: (...args: unknown[]) => putMock(...args),
  del: (...args: unknown[]) => delMock(...args),
  patch: (...args: unknown[]) => patchMock(...args),
}));

import {
  useApiQuery,
  useApiPost,
  useApiPut,
  useApiDelete,
  useApiPatch,
} from './useApi';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
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

describe('useApiQuery', () => {
  it('성공 응답이면 select로 data만 꺼내 반환한다', async () => {
    getMock.mockResolvedValue({ success: true, data: { id: '1' } });

    const { result } = renderHook(
      () => useApiQuery(['user'], '/api/me'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ id: '1' });
    expect(getMock).toHaveBeenCalledWith('/api/me', undefined);
  });

  it('실패 응답(success:false)이면 에러 상태가 된다', async () => {
    getMock.mockResolvedValue({
      success: false,
      error: { code: 'NOT_FOUND', message: '찾을 수 없습니다' },
    });

    const { result } = renderHook(
      () => useApiQuery(['missing'], '/api/missing'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('찾을 수 없습니다');
  });
});

describe('useApiPost', () => {
  it('성공하면 invalidateKeys에 지정된 쿼리를 무효화한다', async () => {
    postMock.mockResolvedValue({ success: true, data: { id: 'new' } });
    const wrapper = createWrapper();

    const { result } = renderHook(
      () =>
        useApiPost<{ id: string }>('/api/posts', {
          invalidateKeys: [['posts']],
        }),
      { wrapper },
    );

    result.current.mutate({ title: '제목' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(postMock).toHaveBeenCalledWith(
      '/api/posts',
      { title: '제목' },
      { headers: undefined },
      undefined,
    );
  });

  it('isPending 중에는 재호출을 무시한다(중복 클릭 방지)', async () => {
    let resolvePost: (v: unknown) => void = () => {};
    postMock.mockReturnValue(
      new Promise((resolve) => {
        resolvePost = resolve;
      }),
    );

    const { result } = renderHook(() => useApiPost('/api/posts'), {
      wrapper: createWrapper(),
    });

    result.current.mutate({});
    await waitFor(() => expect(result.current.isPending).toBe(true));

    result.current.mutate({}); // 두 번째 호출은 무시되어야 함
    resolvePost({ success: true, data: {} });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(postMock).toHaveBeenCalledTimes(1);
  });
});

describe('useApiPut / useApiPatch', () => {
  it('useApiPut은 put API를 호출한다', async () => {
    putMock.mockResolvedValue({ success: true, data: {} });
    const { result } = renderHook(() => useApiPut('/api/posts/1'), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ title: '수정' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(putMock).toHaveBeenCalledWith('/api/posts/1', { title: '수정' });
  });

  it('useApiPatch는 patch API를 호출한다', async () => {
    patchMock.mockResolvedValue({ success: true, data: {} });
    const { result } = renderHook(() => useApiPatch('/api/me/settings'), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ theme: 'dark' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(patchMock).toHaveBeenCalledWith('/api/me/settings', {
      theme: 'dark',
    });
  });
});

describe('useApiDelete', () => {
  it('endpoint가 문자열이면 그대로 사용한다', async () => {
    delMock.mockResolvedValue({ success: true, data: {} });
    const { result } = renderHook(() => useApiDelete('/api/posts/1'), {
      wrapper: createWrapper(),
    });

    result.current.mutate(undefined);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(delMock).toHaveBeenCalledWith('/api/posts/1');
  });

  it('endpoint가 함수면 variables로 URL을 만든다', async () => {
    delMock.mockResolvedValue({ success: true, data: {} });
    const { result } = renderHook(
      () => useApiDelete<unknown, string>((id) => `/api/posts/${id}`),
      { wrapper: createWrapper() },
    );

    result.current.mutate('42');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(delMock).toHaveBeenCalledWith('/api/posts/42');
  });

  it('API 응답이 실패면 mutation이 에러 상태가 된다', async () => {
    delMock.mockResolvedValue({
      success: false,
      error: { code: 'CONFLICT', message: '충돌 발생' },
    });
    const { result } = renderHook(() => useApiDelete('/api/posts/1'), {
      wrapper: createWrapper(),
    });

    result.current.mutate(undefined);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('충돌 발생');
  });
});
