'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { formatDateISO } from '@/lib/date';
import { cn } from '@/lib/utils';

interface DateRange {
  start: string | null;
  end: string | null;
}

interface DateDrawerProps {
  mode: 'single' | 'range';
  onClose: () => void;
  // 단일 선택용
  currentDate?: string;
  onSelectDate?: (date: string) => void;
  // 기간 선택용
  currentRange?: DateRange | null;
  onSelectRange?: (range: DateRange) => void;
}

const DRAWER_UI = {
  single: {
    subTitle: 'SELECT DATE',
    title: '언제의 기록인가요?',
    buttonText: '닫기',
  },
  range: {
    subTitle: 'HISTORY CALENDAR',
    title: '기간 선택',
    buttonText: '완료',
  },
} as const;
export default function DateDrawer({
  mode,
  onClose,
  currentDate,
  onSelectDate,
  currentRange,
  onSelectRange,
}: DateDrawerProps) {
  const [calendarDate, setCalendarDate] = useState(new Date());

  // 내부 범위 상태 (range 모드용)
  const [tempRange, setTempRange] = useState<DateRange>(
    currentRange || { start: null, end: null },
  );

  // 달력 데이터 계산
  const { year, month, firstDayIndex, daysInMonth } = useMemo(() => {
    const y = calendarDate.getFullYear();
    const m = calendarDate.getMonth();
    return {
      year: y,
      month: m,
      firstDayIndex: new Date(y, m, 1).getDay(),
      daysInMonth: new Date(y, m + 1, 0).getDate(),
    };
  }, [calendarDate]);

  const config = DRAWER_UI[mode];

  // 달력이 가장 길어지는 6주를 기준으로 고정 렌더링하기 위한 배열
  const calendarSlots = useMemo(() => {
    return Array.from({ length: 42 });
  }, []);

  // 날짜 클릭 핸들러
  const handleDateClick = (dateStr: string) => {
    if (mode === 'single') {
      onSelectDate?.(dateStr);
    } else {
      // Range 모드 로직
      if (!tempRange.start || (tempRange.start && tempRange.end)) {
        setTempRange({ start: dateStr, end: null });
      } else {
        if (dateStr < tempRange.start) {
          setTempRange({ start: dateStr, end: tempRange.start });
        } else if (dateStr === tempRange.start) {
          setTempRange({ start: null, end: null });
        } else {
          setTempRange({ ...tempRange, end: dateStr });
        }
      }
    }
  };

  const handleComplete = () => {
    if (mode === 'range') onSelectRange?.(tempRange);
    onClose();
  };

  const handleSelectMonth = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDateOfMonth = new Date(year, month, 1);
    if (firstDateOfMonth > today) return;

    const lastDayOfMonth = new Date(year, month + 1, 0);
    // 오늘 이 달의 마지막 날 중 더 빠른 날짜를 종료일로
    const endDate = lastDayOfMonth > today ? today : lastDayOfMonth;

    setTempRange({
      start: formatDateISO(firstDateOfMonth),
      end: formatDateISO(endDate),
    });
  };

  return (
    <Drawer open={true} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="dark:bg-[#1E1E1E] pb-0!">
        <div className="mx-auto w-full px-6 sm:px-8 pt-6 sm:pb-12! pb-6! flex flex-col overflow-y-auto scrollbar-hide">
          {/* 헤더 섹션 */}
          <div className="flex justify-between items-end mb-4 sm:mb-6">
            <div className="flex flex-col items-start text-left">
              <span className="text-[10px] sm:text-[11px] font-bold text-itta-point uppercase tracking-[0.2em] sm:tracking-widest leading-none mb-1">
                {config.subTitle}
              </span>
              <DrawerTitle className="text-base sm:text-lg font-bold dark:text-white">
                {config.title}
              </DrawerTitle>
            </div>
            {mode === 'range' ? (
              <button
                onClick={() => setTempRange({ start: null, end: null })}
                className="flex items-center gap-0.5 sm:gap-1 text-[11px] sm:text-xs text-gray-400 hover:text-itta-point transition-colors mb-1"
              >
                <RotateCcw size={12} className="sm:hidden" />
                <RotateCcw size={14} className="hidden sm:block" /> 초기화
              </button>
            ) : (
              <button
                onClick={() => {
                  setCalendarDate(new Date());
                  onSelectDate?.(formatDateISO(new Date()));
                  onClose();
                }}
                className="text-[11px] sm:text-xs font-bold text-itta-point active:scale-95 transition-transform mb-1"
              >
                오늘로
              </button>
            )}
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between px-1 sm:px-2">
              <span className="text-xs sm:text-sm font-bold dark:text-white">
                {year}년 {month + 1}월
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setCalendarDate(new Date(year, month - 1, 1))}
                  className="p-1.5 sm:p-2 rounded-xl bg-gray-50 dark:bg-white/5 active:scale-95 transition-transform"
                >
                  <ChevronLeft size={16} className="sm:hidden" />
                  <ChevronLeft size={18} className="hidden sm:block" />
                </button>
                <button
                  onClick={() => setCalendarDate(new Date(year, month + 1, 1))}
                  className="p-1.5 sm:p-2 rounded-xl bg-gray-50 dark:bg-white/5 active:scale-95 transition-transform"
                >
                  <ChevronRight size={16} className="sm:hidden" />
                  <ChevronRight size={18} className="hidden sm:block" />
                </button>
              </div>
            </div>

            {/* 캘린더 */}
            <div className="grid grid-cols-7 max-w-md mx-auto text-center">
              {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
                <div
                  key={day}
                  className={cn(
                    'text-center py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-bold',
                    idx === 0
                      ? 'text-rose-500'
                      : idx === 6
                        ? 'text-blue-500'
                        : 'text-gray-400',
                  )}
                >
                  {day}
                </div>
              ))}
              {calendarSlots.map((_, index) => {
                const dayNumber = index - firstDayIndex + 1;
                const isValidDay = dayNumber > 0 && dayNumber <= daysInMonth;

                if (!isValidDay) {
                  return (
                    <div key={`empty-${index}`} className="aspect-square" />
                  );
                }

                const dateObj = new Date(year, month, dayNumber);
                const dateStr = formatDateISO(dateObj);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const isSelectedSingle =
                  mode === 'single' && currentDate === dateStr;
                const isStart = mode === 'range' && tempRange.start === dateStr;
                const isEnd = mode === 'range' && tempRange.end === dateStr;
                const isInRange =
                  mode === 'range' &&
                  tempRange.start &&
                  tempRange.end &&
                  dateStr > tempRange.start &&
                  dateStr < tempRange.end;
                const isActive = isStart || isEnd || isInRange;
                const isFuture = dateObj > today;

                return (
                  <div
                    key={index}
                    className="relative aspect-square flex items-center justify-center"
                  >
                    {mode === 'range' && isActive && (
                      <div
                        className={cn(
                          'absolute inset-y-3 bg-[#10B981]/10 transition-all',
                          isStart && tempRange.end ? 'left-1/2 right-0' : '',
                          isEnd ? 'left-0 right-1/2' : '',
                          isInRange ? 'inset-x-0' : '',
                          isStart && !tempRange.end ? 'hidden' : '',
                        )}
                      />
                    )}
                    <button
                      onClick={() => handleDateClick(dateStr)}
                      disabled={isFuture}
                      className={cn(
                        'relative z-10 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-[11px] sm:text-xs font-bold transition-all rounded-full',
                        isSelectedSingle || isStart || isEnd
                          ? 'bg-[#10B981] text-white shadow-md'
                          : isInRange
                            ? 'text-[#10B981]'
                            : 'dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5',
                        isFuture && 'opacity-20 cursor-not-allowed',
                      )}
                    >
                      {dayNumber}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* 버튼 섹션 */}
            <div className="flex flex-col gap-2 sm:gap-3">
              {mode === 'range' && (
                <button
                  onClick={handleSelectMonth}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 w-full py-3 md:py-4 rounded-2xl font-bold text-xs sm:text-sm bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 active:scale-95 transition-all"
                >
                  <Check className="w-4 sm:w-5 h-4 sm:h-5" />이 달 전체 선택
                </button>
              )}
              <button
                onClick={handleComplete}
                className="w-full py-3 md:py-4 rounded-2xl font-bold text-xs sm:text-sm bg-itta-black text-white dark:bg-white dark:text-black flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg disabled:opacity-50"
              >
                {config.buttonText}
              </button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
