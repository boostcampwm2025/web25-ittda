import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const postMock = vi.fn();
const useApiQueryMock = vi.fn();
vi.mock('@/lib/api/api', () => ({
  post: (...args: unknown[]) => postMock(...args),
}));
vi.mock('./useApi', () => ({
  useApiQuery: (...args: unknown[]) => useApiQueryMock(...args),
}));

import { useSearchQuery, useFrequentTags, useRecentSearches } from './useSearchQuery';
import type { SearchFilters } from './useSearchQuery';

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

const BASE_FILTERS: SearchFilters = {
  query: '제주도',
  tags: ['여행'],
  emotions: [],
  start: null,
  end: null,
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('useSearchQuery', () => {
  it('필터를 바탕으로 검색 결과를 조회한다', async () => {
    postMock.mockResolvedValue({
      success: true,
      data: { items: [], count: 0, nextCursor: null },
    });

    const { result } = renderHook(() => useSearchQuery(BASE_FILTERS), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(postMock).toHaveBeenCalledWith(
      '/api/search',
      expect.objectContaining({ keyword: '제주도', tags: ['여행'], radius: 10 }),
    );
  });

  it('enabled가 false면 요청하지 않는다', () => {
    const { result } = renderHook(
      () => useSearchQuery(BASE_FILTERS, false),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(postMock).not.toHaveBeenCalled();
  });

  it('응답이 실패면 에러 상태가 된다', async () => {
    postMock.mockResolvedValue({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: '검색 실패' },
    });

    const { result } = renderHook(() => useSearchQuery(BASE_FILTERS), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useFrequentTags', () => {
  it('limit을 params로 전달해 자주 쓰는 태그를 조회한다', () => {
    useApiQueryMock.mockReturnValue({ data: undefined });

    renderHook(() => useFrequentTags(5));

    expect(useApiQueryMock).toHaveBeenCalledWith(
      ['search', 'tags', 'frequent', 5],
      '/api/search/tags/stats',
      expect.objectContaining({ params: { limit: 5 } }),
    );
  });
});

describe('useRecentSearches', () => {
  it('최근 검색어를 조회한다', () => {
    useApiQueryMock.mockReturnValue({ data: undefined });

    renderHook(() => useRecentSearches());

    expect(useApiQueryMock).toHaveBeenCalledWith(
      ['search', 'recent'],
      '/api/search/recent',
      expect.objectContaining({ staleTime: 0 }),
    );
  });
});
