'use client';

import { useEffect, useRef, useState } from 'react';

// 스크롤을 내리면 true(숨김), 올리면 false(다시 보임)를 반환한다. Header와
// WeekCalendar처럼 서로 다른 컴포넌트가 같은 신호로 동시에 움직이도록,
// 상태를 어딘가에 공유하는 대신 둘 다 이 훅을 독립적으로 구독한다 — 같은
// window 스크롤 이벤트/기준으로 계산하므로 자연히 같은 타이밍에 맞아떨어진다.
export function useHideOnScroll() {
  const [hidden, setHidden] = useState(false);
  const lastYRef = useRef(0);

  useEffect(() => {
    lastYRef.current = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastYRef.current;

        // 맨 위 근처에서는 항상 보이게(관성/바운스 스크롤로 인한 오탐 방지),
        // 그 외에는 일정량 이상 움직였을 때만 방향을 갱신해 미세한 떨림을 무시.
        // 기준점(lastYRef)은 "판단을 내렸을 때"만 갱신한다 — 매 프레임 갱신하면
        // 느리게 스크롤할 때 프레임간 델타가 계속 문턱을 못 넘어 방향 감지 자체가
        // 안 되는 문제가 있었다(델타가 누적되지 않고 매번 리셋됐음).
        if (y < 16) {
          setHidden(false);
          lastYRef.current = y;
        } else if (Math.abs(delta) > 4) {
          setHidden(delta > 0);
          lastYRef.current = y;
        }
        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return hidden;
}
