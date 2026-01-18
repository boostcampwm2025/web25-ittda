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

  // 날짜 클릭 핸들러
  const handleDateClick = (dateStr: string) => {
    if (mode === 'single') {
      onSelectDate?.(dateStr);
      onClose();
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
    const firstDate = formatDateISO(new Date(year, month, 1));
    const lastDate = formatDateISO(new Date(year, month + 1, 0));
    setTempRange({ start: firstDate, end: lastDate });
  };

  return (
    <Drawer open={true} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="dark:bg-[#1E1E1E]">
        <div className="w-full px-8 py-8 flex flex-col overflow-y-auto scrollbar-hide">
          {/* 헤더 섹션 */}
          <div className="flex justify-between items-end mb-6">
            <div className="flex flex-col items-start text-left">
              <span className="text-[10px] font-bold text-itta-point uppercase tracking-widest leading-none mb-1">
                {config.subTitle}
              </span>
              <DrawerTitle className="text-lg font-bold dark:text-white">
                {config.title}
              </DrawerTitle>
            </div>
            {mode === 'range' ? (
              <button
                onClick={() => setTempRange({ start: null, end: null })}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-itta-point transition-colors mb-1"
              >
                <RotateCcw size={14} /> 초기화
              </button>
            ) : (
              <button
                onClick={() => {
                  setCalendarDate(new Date());
                  onSelectDate?.(formatDateISO(new Date()));
                  onClose();
                }}
                className="text-xs font-bold text-itta-point active:scale-95 transition-transform mb-1"
              >
                오늘로
              </button>
            )}
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <span className="text-sm font-bold dark:text-white">
                {year}년 {month + 1}월
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setCalendarDate(new Date(year, month - 1, 1))}
                  className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 active:scale-95 transition-transform"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setCalendarDate(new Date(year, month + 1, 1))}
                  className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 active:scale-95 transition-transform"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* 캘린더 */}
            <div className="grid grid-cols-7 max-w-md mx-auto text-center">
              {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
                <div
                  key={day}
                  className={cn(
                    'text-center py-2 text-[10px] font-bold',
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
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="h-12" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const d = i + 1;
                const dateStr = formatDateISO(new Date(year, month, d));

                // 스타일 계산 로직
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

                return (
                  <div
                    key={d}
                    className="relative aspect-square flex items-center justify-center"
                  >
                    {/* Range 타입용 연속 띠 효과 */}
                    {mode === 'range' && isActive && (
                      <div
                        className={`absolute inset-y-2.5 bg-itta-point/10 transition-all
                      ${isStart && tempRange.end ? 'left-1/2 right-0' : ''}
                      ${isEnd ? 'left-0 right-1/2' : ''}
                      ${isInRange ? 'inset-x-0' : ''}
                      ${isStart && !tempRange.end ? 'hidden' : ''}
                      `}
                      />
                    )}
                    <button
                      onClick={() => handleDateClick(dateStr)}
                      className={`disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent relative z-10 w-10 h-10 flex items-center justify-center text-xs font-bold transition-all
                      ${isSelectedSingle || isStart || isEnd ? 'bg-itta-point text-white rounded-full shadow-sm' : isInRange ? 'text-itta-point' : 'dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full'}
                      `}
                      disabled={(() => {
                        const date = new Date(dateStr);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        date.setHours(0, 0, 0, 0);

                        // 미래 날짜는 선택 불가
                        return date > today;
                      })()}
                    >
                      {d}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* 버튼 섹션 */}
            <div className="mt-8 flex flex-col gap-3">
              {mode === 'range' && (
                <button
                  onClick={handleSelectMonth}
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold text-sm bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 active:scale-95 transition-all"
                >
                  <Check className="w-5 h-5" />이 달 전체 선택
                </button>
              )}
              <button
                onClick={handleComplete}
                className="w-full py-4 rounded-2xl font-bold text-sm bg-itta-black text-white dark:bg-white dark:text-black flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg disabled:opacity-50"
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
