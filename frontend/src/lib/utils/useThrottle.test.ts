import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useThrottle } from './useThrottle';

describe('useThrottle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('첫 번째 호출은 즉시 실행된다', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useThrottle(fn, 500));

    act(() => {
      result.current.throttled('첫 번째');
    });

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('첫 번째');
  });

  it('delay 이내 연속 호출은 한 번만 실행된다', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useThrottle(fn, 500));

    act(() => {
      result.current.throttled('첫 번째');
      result.current.throttled('두 번째');
      result.current.throttled('세 번째');
    });

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('delay 후 trailing edge에서 마지막 인자로 한 번 더 실행된다', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useThrottle(fn, 500));

    act(() => {
      result.current.throttled('첫 번째');
      result.current.throttled('두 번째');
      result.current.throttled('세 번째');
      vi.advanceTimersByTime(500);
    });

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('세 번째');
  });

  it('delay가 지난 후 다시 호출하면 즉시 실행된다', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useThrottle(fn, 500));

    act(() => {
      result.current.throttled('첫 번째');
      vi.advanceTimersByTime(500);
      result.current.throttled('두 번째');
    });

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(2, '두 번째');
  });

  it('flush 호출 시 대기 중인 실행을 즉시 처리한다', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useThrottle(fn, 500));

    act(() => {
      result.current.throttled('첫 번째');
      result.current.throttled('두 번째');
      result.current.flush();
    });

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('두 번째');
  });
});
