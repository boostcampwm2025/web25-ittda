'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MousePointer2, Keyboard } from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { convertTo12Hour, convertTo24Hour } from '@/lib/utils/time';
import { TimeValue } from '@/lib/types/recordField';

interface TimePickerDrawerProps {
  onClose: () => void;
  currentTime: TimeValue;
  onSave: (time: string) => void;
}

export default function TimePickerDrawer({
  onClose,
  currentTime,
  onSave,
}: TimePickerDrawerProps) {
  const ITEM_HEIGHT = 48;
  const PICKER_HEIGHT = 192;
  const SPACER_HEIGHT = (PICKER_HEIGHT - ITEM_HEIGHT) / 2;
  const time = currentTime.time;
  const initial12Hour = useMemo(() => convertTo12Hour(time), [time]);
  const timeMatch = initial12Hour.match(/(오전|오후)\s(\d+):(\d+)/);
  const [tempPeriod, setTempPeriod] = useState(
    timeMatch ? timeMatch[1] : '오후',
  );
  const [tempHour, setTempHour] = useState(timeMatch ? timeMatch[2] : '2');
  const [tempMinute, setTempMinute] = useState(timeMatch ? timeMatch[3] : '30');
  const [isDirectInput, setIsDirectInput] = useState(false);

  const hourScrollRef = useRef<HTMLDivElement>(null);
  const minuteScrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (
    ref: React.RefObject<HTMLDivElement | null>,
    setter: (val: string) => void,
    startAtOne: boolean = false,
  ) => {
    if (!ref.current) return;
    const index = Math.round(ref.current.scrollTop / ITEM_HEIGHT);
    const value = startAtOne
      ? (index + 1).toString()
      : index.toString().padStart(2, '0');
    if (startAtOne && (index + 1 < 1 || index + 1 > 12)) return;
    if (!startAtOne && (index < 0 || index > 59)) return;
    setter(value);
  };

  // 마운트 시점에 스크롤 위치 초기화
  useEffect(() => {
    if (!isDirectInput) {
      const timer = setTimeout(() => {
        hourScrollRef.current?.scrollTo({
          top: (parseInt(tempHour) - 1) * ITEM_HEIGHT,
        });
        minuteScrollRef.current?.scrollTo({
          top: parseInt(tempMinute) * ITEM_HEIGHT,
        });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isDirectInput]);

  const handleApply = () => {
    const formattedMinute = tempMinute.toString().padStart(2, '0');
    const time12String = `${tempPeriod} ${tempHour}:${formattedMinute}`;
    const time24String = convertTo24Hour(time12String);

    onSave(time24String);
  };

  return (
    <Drawer open={true} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <div className="w-full p-8 pb-12">
          <DrawerHeader className="px-0 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-itta-point uppercase tracking-widest">
                  SELECT TIME
                </span>
                <DrawerTitle className="text-lg font-bold">
                  언제의 기록인가요?
                </DrawerTitle>
              </div>
              <button
                onClick={() => setIsDirectInput(!isDirectInput)}
                className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-1.5 rounded-xl transition-colors"
              >
                {isDirectInput ? (
                  <MousePointer2 size={14} />
                ) : (
                  <Keyboard size={14} />
                )}
                {isDirectInput ? '휠 선택' : '직접 입력'}
              </button>
            </div>
          </DrawerHeader>

          <div className="flex items-center justify-center gap-6 h-[192px] mb-10 relative overflow-hidden">
            {!isDirectInput && (
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[48px] pointer-events-none border-y border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]" />
            )}
            {isDirectInput ? (
              <div className="flex items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
                <input
                  type="number"
                  value={tempHour}
                  onChange={(e) => setTempHour(e.target.value)}
                  className="w-20 h-20 text-center text-3xl font-black rounded-3xl bg-gray-50 dark:bg-white/5 dark:text-white outline-none focus:ring-2 focus:ring-itta-point"
                  min="1"
                  max="12"
                />
                <span className="text-2xl font-bold text-gray-300">:</span>
                <input
                  type="number"
                  value={tempMinute}
                  onChange={(e) => setTempMinute(e.target.value)}
                  className="w-20 h-20 text-center text-3xl font-black rounded-3xl bg-itta-gray1 dark:bg-white/5 dark:text-white outline-none focus:ring-2 focus:ring-itta-point"
                  min="0"
                  max="59"
                />
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2 z-10">
                  {['오전', '오후'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setTempPeriod(p)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${tempPeriod === p ? 'bg-itta-point text-white shadow-lg shadow-itta-point/20' : 'bg-gray-50 dark:bg-white/5 text-gray-400'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div
                  ref={hourScrollRef}
                  onScroll={() =>
                    handleScroll(hourScrollRef, setTempHour, true)
                  }
                  className="flex-1 h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory z-10"
                >
                  <div style={{ height: SPACER_HEIGHT }} />
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-[48px] flex items-center justify-center snap-center font-bold transition-all duration-300 ${tempHour === (i + 1).toString() ? 'text-itta-point text-2xl scale-110' : 'text-gray-300 dark:text-gray-600'}`}
                    >
                      {i + 1}
                    </div>
                  ))}
                  <div style={{ height: SPACER_HEIGHT }} />
                </div>
                <div className="text-itta-gray2 font-bold z-10">:</div>
                <div
                  ref={minuteScrollRef}
                  onScroll={() => handleScroll(minuteScrollRef, setTempMinute)}
                  className="flex-1 h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory z-10"
                >
                  <div style={{ height: SPACER_HEIGHT }} />
                  {[...Array(60)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-[48px] flex items-center justify-center snap-center font-bold transition-all duration-300 ${tempMinute === i.toString().padStart(2, '0') ? 'text-itta-point text-2xl scale-110' : 'text-gray-300 dark:text-gray-600'}`}
                    >
                      {i.toString().padStart(2, '0')}
                    </div>
                  ))}
                  <div style={{ height: SPACER_HEIGHT }} />
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3">
            <DrawerClose className="flex-1 py-4 rounded-2xl font-bold bg-gray-50 dark:bg-white/5 text-gray-400 active:scale-95 transition-transform">
              취소
            </DrawerClose>
            <button
              onClick={handleApply}
              className="flex-[2] py-4 rounded-2xl font-bold bg-itta-point text-white shadow-lg shadow-itta-point/20 active:scale-95 transition-transform"
            >
              적용하기
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
