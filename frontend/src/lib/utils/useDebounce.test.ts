import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('delay가 지나기 전에는 fn이 호출되지 않는다', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useDebounce(fn, 500));

    act(() => {
      result.current.debounced('첫 번째 호출');
    });

    expect(fn).not.toHaveBeenCalled();
  });

  it('delay가 지나면 fn이 호출된다', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useDebounce(fn, 500));

    act(() => {
      result.current.debounced('인자값');
      vi.advanceTimersByTime(500);
    });

    expect(fn).toHaveBeenCalledWith('인자값');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('연속 호출 시 마지막 호출만 실행된다', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useDebounce(fn, 500));

    act(() => {
      result.current.debounced('첫 번째');
      result.current.debounced('두 번째');
      result.current.debounced('세 번째');
      vi.advanceTimersByTime(500);
    });

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('세 번째');
  });

  it('cancel 호출 시 대기 중인 실행이 취소된다', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useDebounce(fn, 500));

    act(() => {
      result.current.debounced('호출');
      result.current.cancel();
      vi.advanceTimersByTime(500);
    });

    expect(fn).not.toHaveBeenCalled();
  });

  it('대기 중인 타이머가 없을 때 cancel을 호출해도 아무 일도 일어나지 않는다', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useDebounce(fn, 500));

    act(() => {
      result.current.cancel();
      vi.advanceTimersByTime(500);
    });

    expect(fn).not.toHaveBeenCalled();
  });

  it('unmount 시 타이머가 정리된다', () => {
    const fn = vi.fn();
    const { result, unmount } = renderHook(() => useDebounce(fn, 500));

    act(() => {
      result.current.debounced('호출');
    });

    unmount();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(fn).not.toHaveBeenCalled();
  });
});
