import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const routerReplaceMock = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: routerReplaceMock }),
  usePathname: () => '/search',
  useSearchParams: () => mockSearchParams,
}));

import { useSearchFilters } from './useSearchFilters';

describe('useSearchFilters', () => {
  afterEach(() => {
    mockSearchParams = new URLSearchParams();
    vi.clearAllMocks();
  });

  it('쿼리 파라미터가 없으면 기본값을 반환한다', () => {
    const { result } = renderHook(() => useSearchFilters());

    expect(result.current.query).toBe('');
    expect(result.current.tags).toEqual([]);
    expect(result.current.emotions).toEqual([]);
    expect(result.current.start).toBeNull();
    expect(result.current.end).toBeNull();
    expect(result.current.location).toBeUndefined();
  });

  it('q, tags, emotions, start, end 파라미터를 파싱한다', () => {
    mockSearchParams = new URLSearchParams(
      'q=제주도&tags=여행,맛집&emotions=행복&start=2024-01-01&end=2024-01-31',
    );

    const { result } = renderHook(() => useSearchFilters());

    expect(result.current.query).toBe('제주도');
    expect(result.current.tags).toEqual(['여행', '맛집']);
    expect(result.current.emotions).toEqual(['행복']);
    expect(result.current.start).toBe('2024-01-01');
    expect(result.current.end).toBe('2024-01-31');
  });

  it('withLocation 옵션이 없으면 lat/lng가 있어도 location을 반환하지 않는다', () => {
    mockSearchParams = new URLSearchParams('lat=37.5&lng=127');

    const { result } = renderHook(() => useSearchFilters());

    expect(result.current.location).toBeUndefined();
  });

  it('withLocation 옵션이 있고 lat/lng가 있으면 location을 반환한다', () => {
    mockSearchParams = new URLSearchParams(
      'lat=37.5&lng=127&radius=500&address=강남구',
    );

    const { result } = renderHook(() =>
      useSearchFilters({ withLocation: true }),
    );

    expect(result.current.location).toEqual({
      lat: 37.5,
      lng: 127,
      address: '강남구',
      radius: 500,
    });
  });

  it('updateUrl은 값이 있으면 set, falsy면 delete하고 router.replace를 호출한다', () => {
    mockSearchParams = new URLSearchParams('q=기존검색어');

    const { result } = renderHook(() => useSearchFilters());
    result.current.updateUrl({ tags: '여행', q: '' });

    expect(routerReplaceMock).toHaveBeenCalledWith(
      '/search?tags=%EC%97%AC%ED%96%89',
      { scroll: false },
    );
  });
});
