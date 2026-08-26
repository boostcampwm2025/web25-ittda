'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { userRecordPatternOptions } from '@/lib/api/profile';
import { useLayoutEffect, useState, type CSSProperties } from 'react';
import { useHideOnScroll } from '@/hooks/useHideOnScroll';
import { cn } from '@/lib/utils';

export default function StreakStats() {
  const { data: streakData } = useSuspenseQuery(userRecordPatternOptions());
  const hidden = useHideOnScroll();

  const [weekCalendarHeight, setWeekCalendarHeight] = useState(0);

  useLayoutEffect(() => {
    let cancelled = false;
    let rafId: number | undefined;
    let observer: ResizeObserver | undefined;
    let attempts = 0;

    const attach = () => {
      if (cancelled) return;
      const calendarEl = document.getElementById('week-calendar-sticky');
      if (!calendarEl) {
        if (attempts++ < 120) rafId = requestAnimationFrame(attach);
        return;
      }

      const updateHeight = () =>
        setWeekCalendarHeight(calendarEl.getBoundingClientRect().height);
      updateHeight();
      observer = new ResizeObserver(updateHeight);
      observer.observe(calendarEl);
    };
    attach();

    return () => {
      cancelled = true;
      if (rafId !== undefined) cancelAnimationFrame(rafId);
      observer?.disconnect();
    };
  }, []);

  return (
    <div
      id="streak-stats-sticky"
      style={
        { '--week-calendar-h': `${weekCalendarHeight}px` } as CSSProperties
      }
      className={cn(
        'sticky z-30 flex w-full p-2 sm:p-3',
        'bg-white/80 dark:bg-[#121212]/80 backdrop-blur-xl',
        hidden
          ? 'top-(--week-calendar-h)'
          : 'top-[calc(4rem+var(--week-calendar-h))] sm:top-[calc(4.5rem+var(--week-calendar-h))]',
      )}
    >
      <div className="flex w-full justify-between gap-1.5 sm:gap-3 items-center border-r px-2 sm:px-3 pr-3 sm:pr-5">
        <span className="text-[11px] sm:text-[12px] whitespace-nowrap">
          오늘 작성
        </span>
        <div className="flex justify-start items-center gap-1 sm:gap-1.5">
          <span className="text-itta-point font-semibold text-sm sm:text-base">
            {streakData.streak}
          </span>
          <span className="text-[11px] sm:text-[12px] font-medium text-gray-400 whitespace-nowrap">
            일째 작성 중
          </span>
        </div>
      </div>
      <div className="flex w-full justify-between gap-1.5 sm:gap-3 items-center px-2 sm:px-3 pl-3 sm:pl-5">
        <span className="text-[11px] sm:text-[12px] whitespace-nowrap">
          이번달 기록
        </span>
        <div className="flex justify-start items-center gap-1 sm:gap-1.5">
          <span className="text-itta-point font-semibold text-sm sm:text-base">
            {streakData.monthlyRecordingDays}
          </span>
          <span className="text-[11px] sm:text-[12px] font-medium text-gray-400 whitespace-nowrap">
            일
          </span>
        </div>
      </div>
    </div>
  );
}
