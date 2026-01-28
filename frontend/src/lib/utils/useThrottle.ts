import { useCallback, useRef } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useThrottle<T extends (...args: any[]) => void>(
  fn: T,
  delay: number,
) {
  const lastRun = useRef<number>(0);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();

      // 마지막 실행 후 delay만큼 시간 지났는지 확인
      if (now - lastRun.current >= delay) {
        fn(...args);
        lastRun.current = now;
      }
    },
    [fn, delay],
  );
}
