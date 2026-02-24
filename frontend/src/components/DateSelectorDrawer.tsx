'use client';

import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Layers,
  X,
} from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './ui/drawer';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { groupDailyRecordedDatesOption } from '@/lib/api/group';
import { myDailyRecordedDatesOption } from '@/lib/api/my';

const ITEM_HEIGHT = 48;
const PICKER_HEIGHT = 192;
const SPACER_HEIGHT = (PICKER_HEIGHT - ITEM_HEIGHT) / 2;
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1999 }, (_, i) => 2000 + i);

interface DateSelectorDrawerProps {
  dayRoute: string;
  monthRoute: string;
  yearRoute: string;
  groupId?: string;
  className?: string;
}

export default function DateSelectorDrawer({
  dayRoute,
  monthRoute,
  yearRoute,
  groupId,
  className,
}: DateSelectorDrawerProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isPickingMonth, setIsPickingMonth] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const [tempYear, setTempYear] = useState(currentDate.getFullYear());
  const [tempMonth, setTempMonth] = useState(currentDate.getMonth());

  const yearScrollRef = useRef<HTMLDivElement>(null);
  const monthScrollRef = useRef<HTMLDivElement>(null);

  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');

  const { data: recordedDates = [] } = useQuery({
    ...(groupId
      ? groupDailyRecordedDatesOption(groupId, year, month)
      : myDailyRecordedDatesOption(year, month)),
    enabled: isOpen,
  });

  // 피커가 열릴 때 스크롤 위치 초기화
  useEffect(() => {
    if (!isPickingMonth) return;
    const timer = setTimeout(() => {
      setTempYear(currentDate.getFullYear());
      setTempMonth(currentDate.getMonth());
      const yearIndex = YEARS.indexOf(currentDate.getFullYear());
      yearScrollRef.current?.scrollTo({ top: yearIndex * ITEM_HEIGHT });
      monthScrollRef.current?.scrollTo({
        top: currentDate.getMonth() * ITEM_HEIGHT,
      });
    }, 50);
    return () => clearTimeout(timer);
  }, [isPickingMonth, currentDate]);

  // 마우스 휠 이벤트 등록
  useEffect(() => {
    if (!isPickingMonth) return;
    const handleWheel = (
      e: WheelEvent,
      ref: React.RefObject<HTMLDivElement | null>,
    ) => {
      if (!ref.current) return;
      e.preventDefault();
      const isMouse = Math.abs(e.deltaY) >= 100;
      const adjustedDelta = isMouse
        ? Math.sign(e.deltaY) * ITEM_HEIGHT
        : e.deltaY;
      ref.current.scrollBy({ top: adjustedDelta, behavior: 'auto' });
    };
    const timer = setTimeout(() => {
      const yEl = yearScrollRef.current;
      const mEl = monthScrollRef.current;
      const onYWheel = (e: WheelEvent) => handleWheel(e, yearScrollRef);
      const onMWheel = (e: WheelEvent) => handleWheel(e, monthScrollRef);
      yEl?.addEventListener('wheel', onYWheel, { passive: false });
      mEl?.addEventListener('wheel', onMWheel, { passive: false });
      return () => {
        yEl?.removeEventListener('wheel', onYWheel);
        mEl?.removeEventListener('wheel', onMWheel);
      };
    }, 100);
    return () => clearTimeout(timer);
  }, [isPickingMonth]);

  const handleYearScroll = () => {
    if (!yearScrollRef.current) return;
    const index = Math.round(yearScrollRef.current.scrollTop / ITEM_HEIGHT);
    if (index >= 0 && index < YEARS.length) setTempYear(YEARS[index]);
  };

  const handleMonthScroll = () => {
    if (!monthScrollRef.current) return;
    const index = Math.round(monthScrollRef.current.scrollTop / ITEM_HEIGHT);
    if (index >= 0 && index < 12) setTempMonth(index);
  };

  const handleApplyMonthYear = () => {
    setCurrentDate(new Date(tempYear, tempMonth, 1));
    setIsPickingMonth(false);
  };

  // 캘린더 날짜 계산 로직
  const getDaysInMonth = (year: number, month: number) => {
    const date = new Date(year, month, 1);
    const days = [];

    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }

    return days;
  };

  const calendarDays = getDaysInMonth(
    currentDate.getFullYear(),
    currentDate.getMonth(),
  );

  const firstDayIndex = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  ).getDay();

  return (
    <>
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          <button
            onClick={() => {
              setIsPickingMonth(false);
            }}
            className="cursor-pointer p-2.5 rounded-2xl transition-all active:scale-90 dark:bg-white/5 dark:text-gray-400 bg-gray-50 text-gray-500"
          >
            <CalendarDays className="w-5 h-5" strokeWidth={2.2} />
          </button>
        </DrawerTrigger>
        <DrawerContent className={className}>
          <div className="w-full px-6 sm:px-8 pt-4 pb-6 sm:pb-8 overflow-y-auto scrollbar-hide">
            <DrawerHeader className="mb-0 pb-0 mx-0 px-0">
              <div className="flex justify-between items-center mb-6 w-full">
                <DrawerTitle className="text-base sm:text-xl font-bold dark:text-white text-itta-black">
                  {isPickingMonth ? '연도와 월 선택' : '날짜로 찾기'}
                </DrawerTitle>
                <DrawerClose className="p-2 text-gray-400">
                  <X className="w-5 h-5 cursor-pointer" />
                </DrawerClose>
              </div>
            </DrawerHeader>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setIsPickingMonth(!isPickingMonth)}
                  className="flex flex-col items-start active:scale-95 group cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold dark:text-white text-itta-black">
                      {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}
                      월
                    </span>
                    <ChevronRight
                      className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isPickingMonth ? 'rotate-90' : 'rotate-0'}`}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-widest">
                    History Calendar
                  </span>
                </button>
                {!isPickingMonth && (
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={() =>
                          setCurrentDate(
                            new Date(
                              currentDate.getFullYear(),
                              currentDate.getMonth() - 1,
                              1,
                            ),
                          )
                        }
                        className="p-2 rounded-xl transition-colors dark:bg-white/5 dark:text-gray-400 bg-gray-50 text-gray-500 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-[7px] font-bold text-gray-400 uppercase tracking-tighter">
                        전월
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={() =>
                          setCurrentDate(
                            new Date(
                              currentDate.getFullYear(),
                              currentDate.getMonth() + 1,
                              1,
                            ),
                          )
                        }
                        className="p-2 rounded-xl transition-colors dark:bg-white/5 dark:text-gray-400 bg-gray-50 text-gray-500 cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <span className="text-[7px] font-bold text-gray-400 uppercase tracking-tighter">
                        후월
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {isPickingMonth ? (
                <div className="animate-in fade-in zoom-in-95 duration-200 select-none">
                  <div className="relative flex items-center justify-center h-48 overflow-hidden">
                    {/* 선택 영역 하이라이트 */}
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-12 pointer-events-none border-y border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 z-0 rounded-lg" />
                    {/* 상하 그라디언트 페이드 */}
                    <div className="absolute inset-0 pointer-events-none z-20 bg-linear-to-b from-white dark:from-[#1c1c1c] via-transparent to-white dark:to-[#1c1c1c] opacity-95" />

                    {/* 연도 휠 */}
                    <div
                      ref={yearScrollRef}
                      onScroll={handleYearScroll}
                      className="w-28 h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory z-10"
                    >
                      <div style={{ height: SPACER_HEIGHT }} />
                      {YEARS.map((y) => (
                        <div
                          key={y}
                          className="flex items-center justify-center snap-center font-black transition-all h-12"
                        >
                          <span
                            className={
                              tempYear === y
                                ? 'text-[#10B981] text-xl'
                                : 'text-gray-300 dark:text-gray-600'
                            }
                          >
                            {y}년
                          </span>
                        </div>
                      ))}
                      <div style={{ height: SPACER_HEIGHT }} />
                    </div>

                    {/* 월 휠 */}
                    <div
                      ref={monthScrollRef}
                      onScroll={handleMonthScroll}
                      className="w-20 h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory z-10"
                    >
                      <div style={{ height: SPACER_HEIGHT }} />
                      {Array.from({ length: 12 }, (_, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-center snap-center font-black transition-all h-12"
                        >
                          <span
                            className={
                              tempMonth === i
                                ? 'text-[#10B981] text-xl'
                                : 'text-gray-300 dark:text-gray-600'
                            }
                          >
                            {i + 1}월
                          </span>
                        </div>
                      ))}
                      <div style={{ height: SPACER_HEIGHT }} />
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setIsPickingMonth(false)}
                      className="flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold bg-gray-100 dark:bg-white/5 text-gray-400 active:scale-95 transition-transform cursor-pointer"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleApplyMonthYear}
                      className="flex-2 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold bg-itta-black text-white dark:bg-white dark:text-black active:scale-95 transition-transform cursor-pointer"
                    >
                      적용하기
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-1 max-w-md mx-auto">
                  {['일', '월', '화', '수', '목', '금', '토'].map(
                    (day, idx) => (
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
                    ),
                  )}
                  {Array.from({ length: firstDayIndex }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}
                  {calendarDays.map((date) => {
                    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                    const hasRecord = recordedDates.includes(dateStr);
                    const isToday =
                      new Date().toDateString() === date.toDateString();
                    return (
                      <button
                        key={dateStr}
                        onClick={() => {
                          router.push(`${dayRoute}/${dateStr}`);
                        }}
                        className={cn(
                          'cursor-pointer relative aspect-square flex flex-col items-center justify-center rounded-xl transition-all',
                          'disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent',
                          isToday
                            ? 'dark:bg-white dark:text-black bg-itta-black text-white'
                            : date.getDay() === 0
                              ? 'dark:hover:bg-white/5 dark:text-rose-400 hover:bg-gray-50 text-rose-500'
                              : date.getDay() === 6
                                ? 'dark:hover:bg-white/5 dark:text-blue-400 hover:bg-gray-50 text-blue-500'
                                : 'dark:hover:bg-white/5 dark:text-gray-300 hover:bg-gray-50 text-gray-600',
                        )}
                        disabled={(() => {
                          const date = new Date(dateStr);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          date.setHours(0, 0, 0, 0);

                          // 미래 날짜는 선택 불가
                          return date > today;
                        })()}
                      >
                        <span className="text-xs font-bold">
                          {date.getDate()}
                        </span>
                        {hasRecord && (
                          <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-[#10B981]" />
                        )}
                      </button>
                    );
                  })}
                  {Array.from({
                    length: 42 - firstDayIndex - calendarDays.length,
                  }).map((_, i) => (
                    <div key={`empty-end-${i}`} className="aspect-square" />
                  ))}
                </div>
              )}
            </div>

            {!isPickingMonth && (
              <div className="mt-8 flex flex-col gap-3">
                <DrawerClose
                  className="cursor-pointer flex w-full flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold shadow-xl transition-all active:scale-95 items-center justify-center gap-2 dark:bg-white dark:text-[#121212] bg-itta-black text-white"
                  onClick={() => {
                    const monthId = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
                    router.push(`${monthRoute}/${monthId}`);
                  }}
                >
                  <Check className="w-5 h-5" />월 기록 전체보기
                </DrawerClose>

                <DrawerClose
                  className="cursor-pointer w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold border transition-all active:scale-[0.98] flex items-center justify-center gap-2 dark:bg-white/5 dark:border-white/10 dark:text-gray-300 bg-white border-gray-100 text-gray-500"
                  onClick={() => {
                    router.push(`${yearRoute}/${currentDate.getFullYear()}`);
                  }}
                >
                  <Layers className="w-4 h-4" />
                  {currentDate.getFullYear()}년 기록 전체보기
                </DrawerClose>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
