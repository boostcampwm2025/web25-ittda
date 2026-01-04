'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { formatDateDot } from '@/lib/date';

interface DatePickerDrawerProps {
  onClose: () => void;
  currentDate: string;
  onSelect: (formattedDate: string) => void;
}

export default function DatePickerDrawer({
  onClose,
  currentDate,
  onSelect,
}: DatePickerDrawerProps) {
  const [viewDate, setViewDate] = useState(() => {
    if (currentDate) {
      const [y, m, d] = currentDate.split('.').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const selectFormattedDate = (date: Date) => {
    onSelect(formatDateDot(date));
    onClose();
  };

  const changeMonth = (offset: number) => {
    setViewDate(new Date(year, month + offset, 1));
  };

  return (
    <Drawer open={true} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <div className="max-w-sm mx-auto w-full p-8 pb-12">
          <DrawerHeader className="px-0 mb-8 flex flex-row items-center justify-between space-y-0">
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-widest">
                SELECT DATE
              </span>
              <DrawerTitle className="text-lg font-bold">
                언제의 기록인가요?
              </DrawerTitle>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => changeMonth(-1)}
                className="p-2 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 dark:text-white transition-colors active:bg-gray-100"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => changeMonth(1)}
                className="p-2 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 dark:text-white transition-colors active:bg-gray-100"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </DrawerHeader>

          <div className="mb-6">
            <div className="flex justify-between items-center px-1 mb-4">
              <span className="text-sm font-bold dark:text-white">
                {year}년 {month + 1}월
              </span>
              <button
                onClick={() => selectFormattedDate(new Date())}
                className="text-xs font-bold text-[#10B981] active:scale-95 transition-transform"
              >
                오늘로
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                <span
                  key={d}
                  className={`text-[10px] font-bold mb-2 ${i === 0 ? 'text-rose-500' : 'text-gray-400'}`}
                >
                  {d}
                </span>
              ))}
              {[...Array(firstDayOfMonth)].map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {[...Array(daysInMonth)].map((_, i) => {
                const dayNum = i + 1;
                const dateObj = new Date(year, month, dayNum);
                const isSelected = formatDateDot(dateObj) === currentDate;

                return (
                  <button
                    key={dayNum}
                    onClick={() => selectFormattedDate(dateObj)}
                    className={`aspect-square flex items-center justify-center text-xs font-semibold rounded-xl transition-all ${
                      isSelected
                        ? 'bg-[#10B981] text-white shadow-lg'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-full py-4 rounded-2xl font-bold text-sm bg-[#333333] text-white dark:bg-white/5 dark:text-gray-400 active:scale-95 transition-transform"
          >
            닫기
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
