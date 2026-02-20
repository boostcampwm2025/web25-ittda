'use client';

import {
  formatDateISO,
  getStartOfWeek,
  getWeekDays,
  parseLocalDate,
} from '@/lib/date';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WeekCalendar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL에서 date 파라미터 읽기 (서버에서 이미 리다이렉트 처리됨)
  const selectedDateStr = searchParams.get('date') || formatDateISO();

  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    getStartOfWeek(parseLocalDate(selectedDateStr)),
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
      const today = new Date();
      today.setHours(0, 0, 0, 0);

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

  const handleTouchDate = (dateStr: string) => {
    const selectedDate = parseLocalDate(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    // 미래 날짜는 선택 불가
    if (selectedDate > today) {
      return;
    }

    // URL 쿼리 파라미터로 날짜 설정
    router.push(`/?date=${dateStr}`);
    calculateYearMonth(dateStr);
  };

  return (
    <div className="overflow-hidden">
      <div
        className="px-4 py-2 sm:px-6 flex items-center gap-1 group cursor-pointer self-start"
        onClick={() =>
          router.push(`/my/month/${displayYearMonth.replace('.', '-')}`)
        }
      >
        <span className="text-sm sm:text-base font-semibold dark:text-white text-itta-black">
          {displayYearMonth}
        </span>
        <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 transition-transform dark:text-white text-itta-black" />
      </div>
      <div className="relative h-24">
        <div className="px-3 py-3 sm:px-4 sm:py-4 flex justify-between">
          {weekDays.map((item) => {
            const dayColor =
              item.dayName === '일'
                ? '#F43F5E'
                : item.dayName === '토'
                  ? '#3B82F6'
                  : '#9CA3AF';

            return (
              <div
                key={`header-${item.dateStr}`}
                className="flex flex-col items-center gap-1.5 sm:gap-2 min-w-10 sm:min-w-11"
              >
                <span
                  className="text-[10px] sm:text-[11px] font-medium"
                  style={{ color: dayColor }}
                >
                  {item.dayName}
                </span>
              </div>
            );
          })}
        </div>

        {/* 스와이프 가능한 영역 */}
        <div className="border-gray-100 absolute top-8.5 left-0 right-0 h-[calc(100%-34px)]">
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
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const isFuture = item.date > today;

                return (
                  <button
                    key={item.dateStr}
                    onClick={() => handleTouchDate(item.dateStr)}
                    disabled={isFuture}
                    className={cn(
                      'flex items-center justify-center min-w-10 sm:min-w-11 transition-transform',
                      isFuture
                        ? 'cursor-not-allowed opacity-40'
                        : 'active:scale-95 cursor-pointer',
                    )}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl text-xs sm:text-sm font-medium transition-all dark:text-gray-200',
                        isSelected
                          ? 'dark:bg-white dark:text-[#121212] bg-itta-black text-white shadow-md'
                          : item.isToday
                            ? 'dark:text-[#10B981] dark:bg-[#10B981]/10 text-[#10B981] bg-[#10B981]/5'
                            : 'text-gray-500',
                        item.dayName === '일' && 'text-[#F43F5E]',
                        item.dayName === '토' && 'text-[#3B82F6]',
                      )}
                    >
                      {item.date.getDate()}
                    </div>
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
