import { useCallback, useRef } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDebounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number,
) {
  // 타이머를 useRef로 관리해야 리렌더링 시에도 값이 초기화되지 않음
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debounced = useCallback(
    (...args: Parameters<T>) => {
      // 이전 타이머 취소
      if (timer.current) {
        clearTimeout(timer.current);
      }

      // 새로운 타이머 설정
      timer.current = setTimeout(() => {
        fn(...args);
      }, delay);
    },
    [fn, delay],
  );

  const cancel = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  return { debounced, cancel };
}
