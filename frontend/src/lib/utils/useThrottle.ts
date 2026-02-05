import { useCallback, useEffect, useRef } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useThrottle<T extends (...args: any[]) => void>(
  fn: T,
  delay: number,
) {
  const lastRun = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastArgs = useRef<Parameters<T> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const throttled = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      lastArgs.current = args; // 가장 최신 데이터 저장

      // 마지막 실행 후 delay만큼 시간 지났는지 확인
      if (now - lastRun.current >= delay) {
        fn(...args);
        lastRun.current = now;
      } else {
        // delay만큼 지나지 않았는데 입력이 들어왔다면, delay가 끝나는 시점에 마지막 값으로 실행 예약
        const remaining = delay - (now - lastRun.current);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(() => {
          if (lastArgs.current) {
            fn(...lastArgs.current);
            lastRun.current = Date.now();
            timeoutRef.current = null;
          }
        }, remaining);
      }
    },
    [fn, delay],
  );

  // flush 함수: 대기 중인 업데이트를 즉시 실행
  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (lastArgs.current) {
      fn(...lastArgs.current);
      lastRun.current = Date.now();
      lastArgs.current = null;
    }
  }, [fn]);

  return { throttled, flush };
}
