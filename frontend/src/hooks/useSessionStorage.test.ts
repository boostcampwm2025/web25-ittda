import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSessionStorage } from './useSessionStorage';

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/lib/utils/logger', () => ({ logger: { error: vi.fn() } }));

describe('useSessionStorage', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('초기값을 반환한다', () => {
    const { result } = renderHook(() => useSessionStorage('test-key', '초기값'));
    const [value] = result.current;
    expect(value).toBe('초기값');
  });

  it('setValue로 값을 변경하면 상태와 sessionStorage가 모두 업데이트된다', () => {
    const { result } = renderHook(() => useSessionStorage('test-key', '초기값'));

    act(() => {
      result.current[1]('변경된 값');
    });

    expect(result.current[0]).toBe('변경된 값');
    expect(JSON.parse(sessionStorage.getItem('test-key')!)).toBe('변경된 값');
  });

  it('함수형 업데이트를 지원한다', () => {
    const { result } = renderHook(() => useSessionStorage('count', 0));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(1);
  });

  it('removeValue 호출 시 초기값으로 돌아가고 sessionStorage에서 제거된다', () => {
    const { result } = renderHook(() => useSessionStorage('test-key', '초기값'));

    act(() => {
      result.current[1]('저장된 값');
    });

    act(() => {
      result.current[2]();
    });

    expect(result.current[0]).toBe('초기값');
    expect(sessionStorage.getItem('test-key')).toBeNull();
  });

  it('객체 값을 JSON으로 직렬화해서 저장한다', () => {
    const initialValue = { name: '테스트', count: 0 };
    const { result } = renderHook(() =>
      useSessionStorage('test-obj', initialValue),
    );

    act(() => {
      result.current[1]({ name: '변경', count: 1 });
    });

    const stored = JSON.parse(sessionStorage.getItem('test-obj')!);
    expect(stored).toEqual({ name: '변경', count: 1 });
  });

  it('sessionStorage에 기존 값이 있으면 초기값 대신 저장된 값을 반환한다', () => {
    sessionStorage.setItem('test-key', JSON.stringify('기존 값'));

    const { result } = renderHook(() => useSessionStorage('test-key', '초기값'));

    expect(result.current[0]).toBe('기존 값');
  });

  it('sessionStorage 읽기 실패 시 초기값을 반환한다', () => {
    sessionStorage.setItem('bad-key', 'invalid json {{{');

    const { result } = renderHook(() => useSessionStorage('bad-key', '초기값'));

    expect(result.current[0]).toBe('초기값');
  });
});
