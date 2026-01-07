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
import { useState } from 'react';

interface DateSelectorDrawerProps {
  dayRoute: string;
  monthRoute: string;
  yearRoute: string;
}

export default function DateSelectorDrawer({
  dayRoute,
  monthRoute,
  yearRoute,
}: DateSelectorDrawerProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isPickingMonth, setIsPickingMonth] = useState(false);

  // 개인 기록이 있는 날짜들
  // TODO: props로 데이터를 받아 출력
  const recordedDates = [
    '2025-12-21',
    '2025-12-20',
    '2025-12-15',
    '2025-12-10',
    '2025-11-15',
    '2025-11-02',
  ];

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
      <Drawer>
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
        <DrawerContent>
          <div className="w-full px-8 pt-4 pb-8 overflow-y-auto scrollbar-hide">
            <DrawerHeader className="mb-0 pb-0 mx-0 px-0">
              <div className="flex justify-between items-center mb-6 w-full">
                <DrawerTitle className="text-lg font-bold dark:text-white text-itta-black">
                  {isPickingMonth ? '연도와 월 선택' : '날짜로 찾기'}
                </DrawerTitle>
                <DrawerClose className="p-2 text-gray-400">
                  <X className="w-5 h-5 cursor-pointer" />
                </DrawerClose>
              </div>
            </DrawerHeader>

            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
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
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      isPickingMonth
                        ? setCurrentDate(
                            new Date(
                              currentDate.getFullYear() - 1,
                              currentDate.getMonth(),
                              1,
                            ),
                          )
                        : setCurrentDate(
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
                  <button
                    onClick={() =>
                      isPickingMonth
                        ? setCurrentDate(
                            new Date(
                              currentDate.getFullYear() + 1,
                              currentDate.getMonth(),
                              1,
                            ),
                          )
                        : setCurrentDate(
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
                </div>
              </div>

              {isPickingMonth ? (
                <div className="grid grid-cols-4 gap-2 animate-in fade-in zoom-in-95 duration-200">
                  {Array.from({ length: 12 }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setCurrentDate(
                          new Date(currentDate.getFullYear(), i, 1),
                        );
                        setIsPickingMonth(false);
                      }}
                      className={cn(
                        'py-4 rounded-2xl text-sm font-bold transition-all',
                        currentDate.getMonth() === i
                          ? 'bg-[#10B981] text-white shadow-lg'
                          : 'dark:bg-white/5 dark:text-gray-500 bg-gray-50 text-gray-500',
                      )}
                    >
                      {i + 1}월
                    </button>
                  ))}
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
                    <div key={`empty-${i}`} />
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
                          'relative aspect-square flex flex-col items-center justify-center rounded-xl transition-all',
                          isToday
                            ? 'dark:bg-white dark:text-black bg-itta-black text-white'
                            : 'dark:hover:bg-white/5 dark:text-gray-300 hover:bg-gray-50 text-gray-600',
                        )}
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
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <DrawerClose
                className="flex w-full flex-1 py-4 rounded-2xl text-sm font-bold shadow-xl transition-all active:scale-95 items-center justify-center gap-2 dark:bg-white dark:text-[#121212] bg-itta-black text-white"
                onClick={() => {
                  const monthId = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
                  router.push(`${monthRoute}/${monthId}`);
                }}
              >
                <Check className="w-5 h-5" />월 기록 전체보기
              </DrawerClose>

              <DrawerClose
                className="w-full py-4 rounded-2xl text-sm font-bold border transition-all active:scale-[0.98] flex items-center justify-center gap-2 dark:bg-white/5 dark:border-white/10 dark:text-gray-300 bg-white border-gray-100 text-gray-500"
                onClick={() => {
                  router.push(`${yearRoute}/${currentDate.getFullYear()}`);
                }}
              >
                <Layers className="w-4 h-4" />
                {currentDate.getFullYear()}년 기록 전체보기
              </DrawerClose>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
