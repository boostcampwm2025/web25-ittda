'use client';

import {
  formatDateISO,
  getStartOfWeek,
  getWeekDays,
  parseLocalDate,
} from '@/lib/date';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRecordTimeline } from './RecordTimelineProvider';
import { useHideOnScroll } from '@/hooks/useHideOnScroll';

export default function WeekCalendar({
  monthBasePath = '/my',
  className,
  stickyTopClassName,
  stickyTopPx,
}: {
  monthBasePath?: string;
  className?: string;
  stickyTopClassName?: string;
  stickyTopPx?: number;
}) {
  const router = useRouter();
  const { activeDate, requestJump } = useRecordTimeline();
  const hidden = useHideOnScroll();

  // 캘린더는 "탭해서 필터"가 아니라 RecordTimelineFeed의 스크롤 위치를
  // 보여주는 인덱스다 — 선택된 날짜는 이제 URL이 아니라 Provider가 소유.
  const selectedDateStr = activeDate;

  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    getStartOfWeek(parseLocalDate(activeDate)),
  );
  const [direction, setDirection] = useState(0); // -1: 이전, 1: 다음
  const [isMounted, setIsMounted] = useState(false); // 초기 마운트 추적
  const [displayYearMonth, setDisplayYearMonth] = useState(() => {
    const d = parseLocalDate(selectedDateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // 초기 마운트 추적 (라우팅 후 첫 렌더링 시 애니메이션 스킵)
  useEffect(() => {
    const rAF = requestAnimationFrame(() => {
      setIsMounted(true);
    });

    return () => {
      cancelAnimationFrame(rAF);
    };
  }, []);

  // 연월 표시용 계산 (중앙 주차 기준)
  const calculateYearMonth = useCallback(
    (dateStr?: string) => {
      const d = dateStr ? parseLocalDate(dateStr) : currentWeekStart;
      setDisplayYearMonth(
        `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`,
      );
    },
    [currentWeekStart],
  );

  // 주간 이동 핸들러
  const paginate = (newDirection: number) => {
    if (newDirection > 0) {
      const nextWeekStart = new Date(currentWeekStart);
      nextWeekStart.setDate(nextWeekStart.getDate() + 7);
      // new Date()는 서버 렌더링 시 서버의 로컬 타임존(UTC)을 기준으로 자정을 계산해
      // 한국 시간 00~09시 사이엔 하루 전으로 어긋난다. formatDateISO는 Asia/Seoul로 고정 계산하므로 안전하다.
      const today = parseLocalDate(formatDateISO());

      // 다음 주의 시작일이 오늘 이후라면 페이지네이션 차단
      if (nextWeekStart > today) {
        return;
      }
    }

    setDirection(newDirection);

    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + newDirection * 7);

    setCurrentWeekStart(next);

    // 새로운 주의 시작일을 직접 전달하여 연월 계산
    setDisplayYearMonth(
      `${next.getFullYear()}.${String(next.getMonth() + 1).padStart(2, '0')}`,
    );
  };

  // 애니메이션 변수 설정
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
    }),
  };

  const weekDays = useMemo(
    () => getWeekDays(currentWeekStart),
    [currentWeekStart],
  );

  // activeDate가 (스크롤에 의해) 현재 표시 중인 주 밖으로 벗어나면, 그 주로
  // 자동으로 스냅한다 — 인덱스가 항상 지금 보는 위치를 반영하도록.
  useEffect(() => {
    const activeWeekStart = getStartOfWeek(parseLocalDate(activeDate));
    if (activeWeekStart.getTime() === currentWeekStart.getTime()) return;

    setDirection(activeWeekStart > currentWeekStart ? 1 : -1);
    setCurrentWeekStart(activeWeekStart);
    setDisplayYearMonth(
      `${activeWeekStart.getFullYear()}.${String(activeWeekStart.getMonth() + 1).padStart(2, '0')}`,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDate]);

  const handleTouchDate = (dateStr: string) => {
    const selectedDate = parseLocalDate(dateStr);
    const today = parseLocalDate(formatDateISO());
    selectedDate.setHours(0, 0, 0, 0);

    // 미래 날짜는 선택 불가
    if (selectedDate > today) {
      return;
    }

    requestJump(dateStr);
    calculateYearMonth(dateStr);
  };

  return (
    <div
      id="week-calendar-sticky"
      className={cn(
        'sticky z-40 overflow-hidden',
        'bg-white/80 dark:bg-[#121212]/80 backdrop-blur-xl',
        stickyTopClassName ?? (hidden ? 'top-0' : 'top-16 sm:top-18'),
        className,
      )}
      style={stickyTopPx !== undefined ? { top: stickyTopPx } : undefined}
    >
      <div className="px-4 py-2 sm:px-6 flex items-center gap-1 group cursor-pointer self-start">
        <span
          className="flex items-center"
          onClick={() =>
            router.push(
              `${monthBasePath}/month/${displayYearMonth.replace('.', '-')}`,
            )
          }
        >
          <span className="text-sm sm:text-base font-semibold dark:text-white text-itta-black">
            {displayYearMonth}
          </span>
          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 transition-transform dark:text-white text-itta-black" />
        </span>
      </div>
      {/* 지금 스크롤로 보고 있는 날짜를 보여주는 얇은 인덱스 — 탭하면 그
            지점으로 스크롤, 스크롤하면 반대로 여기 활성 표시가 따라온다. */}
      <div className="relative h-16 border-b dark:border-white/5 border-gray-100">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentWeekStart.toISOString()}
            custom={direction}
            variants={variants}
            initial={isMounted ? 'enter' : false}
            animate="center"
            exit={isMounted ? 'exit' : undefined}
            transition={
              isMounted
                ? { type: 'spring', stiffness: 300, damping: 33 }
                : { duration: 0 }
            }
            drag={isMounted ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(e, { offset }) => {
              const swipe = offset.x;
              if (swipe < -50) paginate(1);
              else if (swipe > 50) paginate(-1);
            }}
            className="absolute inset-0 px-3 sm:px-4 flex justify-between touch-none select-none bg-transparent cursor-grab"
          >
            {weekDays.map((item) => {
              const isSelected = selectedDateStr === item.dateStr;
              const today = parseLocalDate(formatDateISO());
              const isFuture = item.date > today;
              const isWeekendColor =
                item.dayName === '일' || item.dayName === '토';

              return (
                <button
                  key={item.dateStr}
                  onClick={() => handleTouchDate(item.dateStr)}
                  disabled={isFuture}
                  className={cn(
                    'flex items-center justify-center min-w-9 sm:min-w-10 transition-transform',
                    isFuture
                      ? 'cursor-not-allowed opacity-40'
                      : 'active:scale-95 cursor-pointer',
                  )}
                >
                  <div
                    className={cn(
                      'w-9 sm:w-10 py-1.5 sm:py-2 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all',
                      isSelected && 'dark:bg-white bg-itta-black shadow-md',
                      !isSelected &&
                        item.isToday &&
                        'ring-1 ring-inset ring-[#10B981]/60',
                    )}
                  >
                    <span
                      className={cn(
                        'text-[9px] sm:text-[10px] font-medium',
                        isSelected
                          ? 'dark:text-[#121212]/60 text-white/70'
                          : isWeekendColor
                            ? item.dayName === '일'
                              ? 'text-[#F43F5E]'
                              : 'text-[#3B82F6]'
                            : 'text-gray-400 dark:text-gray-500',
                      )}
                    >
                      {item.dayName}
                    </span>
                    <span
                      className={cn(
                        'text-xs sm:text-sm font-bold',
                        isSelected
                          ? 'dark:text-[#121212] text-white'
                          : item.isToday
                            ? 'text-[#10B981]'
                            : isWeekendColor
                              ? item.dayName === '일'
                                ? 'text-[#F43F5E]'
                                : 'text-[#3B82F6]'
                              : 'text-gray-600 dark:text-gray-300',
                      )}
                    >
                      {item.date.getDate()}
                    </span>
                  </div>
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
