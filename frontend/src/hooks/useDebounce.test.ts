import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebouncedValue } from './useDebounce';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('초기값을 즉시 반환한다', () => {
    const { result } = renderHook(() => useDebouncedValue('초기', 500));
    expect(result.current).toBe('초기');
  });

  it('delay 이전에는 값이 변경되지 않는다', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 500),
      { initialProps: { value: '초기' } },
    );

    act(() => {
      rerender({ value: '변경' });
    });

    expect(result.current).toBe('초기');
  });

  it('delay 이후에 변경된 값을 반환한다', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 500),
      { initialProps: { value: '초기' } },
    );

    act(() => { rerender({ value: '변경' }); });
    act(() => { vi.advanceTimersByTime(500); });

    expect(result.current).toBe('변경');
  });

  it('연속으로 값이 바뀌면 마지막 값만 반영된다', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 500),
      { initialProps: { value: '초기' } },
    );

    act(() => { rerender({ value: '첫 번째' }); });
    act(() => { rerender({ value: '두 번째' }); });
    act(() => { rerender({ value: '세 번째' }); });
    act(() => { vi.advanceTimersByTime(500); });

    expect(result.current).toBe('세 번째');
  });

  it('unmount 시 타이머가 정리된다', () => {
    const { result, rerender, unmount } = renderHook(
      ({ value }) => useDebouncedValue(value, 500),
      { initialProps: { value: '초기' } },
    );

    act(() => {
      rerender({ value: '변경' });
    });

    unmount();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe('초기');
  });
});
