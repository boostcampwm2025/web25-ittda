import { useCallback, useRef, useEffect } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDebounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number,
) {
  // 타이머를 useRef로 관리해야 리렌더링 시에도 값이 초기화되지 않음
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // fn을 ref로 관리하여 매번 재생성되어도 useCallback이 재실행되지 않도록 함
  const fnRef = useRef(fn);

  // fn이 바뀔 때마다 ref 업데이트
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  const debounced = useCallback(
    (...args: Parameters<T>) => {
      // 이전 타이머 취소
      if (timer.current) {
        clearTimeout(timer.current);
      }

      // 새로운 타이머 설정
      timer.current = setTimeout(() => {
        fnRef.current(...args);
      }, delay);
    },
    [delay],
  );

  const cancel = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  return { debounced, cancel };
}
