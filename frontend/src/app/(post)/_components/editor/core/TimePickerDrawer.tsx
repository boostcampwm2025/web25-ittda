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

  // 24시간 형식에서 시간 추출 (예: "14:30" -> hour=14, minute=30)
  const [initialHour, initialMinute] = useMemo(() => {
    const parts = time.split(':');
    return [parseInt(parts[0] || '14'), parseInt(parts[1] || '30')];
  }, [time]);

  const initialPeriod = initialHour >= 12 ? '오후' : '오전';

  const [tempPeriod, setTempPeriod] = useState(initialPeriod);
  const [tempHour, setTempHour] = useState(initialHour); // 0-23 형식으로 저장
  const [tempMinute, setTempMinute] = useState(initialMinute);
  const [isDirectInput, setIsDirectInput] = useState(false);

  const hourScrollRef = useRef<HTMLDivElement>(null);
  const minuteScrollRef = useRef<HTMLDivElement>(null);

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

  const handleHourScroll = () => {
    if (!hourScrollRef.current) return;
    const index = Math.round(hourScrollRef.current.scrollTop / ITEM_HEIGHT);
    // 오전: 0-11, 오후: 12-23
    const hour = tempPeriod === '오전' ? index : index + 12;
    if (hour < 0 || hour > 23) return;
    setTempHour(hour);
  };

  const handleMinuteScroll = () => {
    if (!minuteScrollRef.current) return;
    const index = Math.round(minuteScrollRef.current.scrollTop / ITEM_HEIGHT);
    if (index < 0 || index > 59) return;
    setTempMinute(index);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const hEl = hourScrollRef.current;
      const mEl = minuteScrollRef.current;
      const onHWheel = (e: WheelEvent) => handleWheel(e, hourScrollRef);
      const onMWheel = (e: WheelEvent) => handleWheel(e, minuteScrollRef);

      if (hEl && mEl && !isDirectInput) {
        hEl.addEventListener('wheel', onHWheel, { passive: false });
        mEl.addEventListener('wheel', onMWheel, { passive: false });
      }
      return () => {
        hEl?.removeEventListener('wheel', onHWheel);
        mEl?.removeEventListener('wheel', onMWheel);
      };
    }, 100);
    return () => clearTimeout(timer);
  }, [isDirectInput]);

  useEffect(() => {
    if (!isDirectInput) {
      const timer = setTimeout(() => {
        // 오전: 0-11, 오후: 12-23 -> 스크롤 인덱스는 0-11
        const hourIndex = tempHour % 12;
        hourScrollRef.current?.scrollTo({
          top: hourIndex * ITEM_HEIGHT,
        });
        minuteScrollRef.current?.scrollTo({
          top: tempMinute * ITEM_HEIGHT,
        });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isDirectInput, tempPeriod, tempHour, tempMinute]);

  const handleApply = () => {
    const formattedHour = tempHour.toString().padStart(2, '0');
    const formattedMinute = tempMinute.toString().padStart(2, '0');
    onSave(`${formattedHour}:${formattedMinute}`);
  };

  const handleSetNow = () => {
    const now = new Date();
    const h = now.getHours(); // 0-23
    const m = now.getMinutes();
    const period = h >= 12 ? '오후' : '오전';

    setTempPeriod(period);
    setTempHour(h);
    setTempMinute(m);

    if (!isDirectInput) {
      const hourIndex = h % 12; // 0-11
      const hPos = hourIndex * ITEM_HEIGHT;
      const mPos = m * ITEM_HEIGHT;

      hourScrollRef.current?.scrollTo({ top: hPos, behavior: 'smooth' });
      minuteScrollRef.current?.scrollTo({ top: mPos, behavior: 'smooth' });
    }
  };

  const handlePeriodChange = (newPeriod: string) => {
    const oldPeriod = tempPeriod;
    setTempPeriod(newPeriod);

    // 오전 <-> 오후 전환 시 시간도 조정 (0-11 <-> 12-23)
    if (oldPeriod !== newPeriod) {
      if (newPeriod === '오후' && tempHour < 12) {
        setTempHour(tempHour + 12);
      } else if (newPeriod === '오전' && tempHour >= 12) {
        setTempHour(tempHour - 12);
      }
    }
  };

  return (
    <Drawer open={true} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <div className="w-full p-6 sm:p-8 pb-10 sm:pb-12 select-none">
          <DrawerHeader className="px-0 mb-6 sm:mb-8">
            <div className="flex items-center justify-between">
              <div className="flex flex-col text-left">
                <span className="text-[10px] sm:text-[11px] font-bold text-itta-point uppercase tracking-[0.2em] sm:tracking-widest">
                  SELECT TIME
                </span>
                <DrawerTitle className="text-base sm:text-lg font-bold">
                  언제의 기록인가요?
                </DrawerTitle>
              </div>
              <div className="flex gap-1.5 sm:gap-2">
                <button
                  onClick={handleSetNow}
                  className="text-[9px] sm:text-[10px] font-bold text-itta-point bg-itta-point/10 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl active:scale-95 transition-transform"
                >
                  지금으로
                </button>
                <button
                  onClick={() => setIsDirectInput(!isDirectInput)}
                  className="flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-white/5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl active:scale-95 transition-transform"
                >
                  {isDirectInput ? (
                    <>
                      <MousePointer2 size={12} className="sm:hidden" />
                      <MousePointer2 size={14} className="hidden sm:block" />
                    </>
                  ) : (
                    <>
                      <Keyboard size={12} className="sm:hidden" />
                      <Keyboard size={14} className="hidden sm:block" />
                    </>
                  )}
                  {isDirectInput ? '휠 선택' : '직접 입력'}
                </button>
              </div>
            </div>
          </DrawerHeader>

          <div className="flex items-center justify-between gap-3 sm:gap-4 h-45 sm:h-48 mb-8 sm:mb-10">
            <div className="flex flex-col gap-1.5 sm:gap-2 z-30 shrink-0">
              {['오전', '오후'].map((p) => (
                <button
                  key={p}
                  onClick={() => handlePeriodChange(p)}
                  className={`px-3.5 sm:px-5 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    tempPeriod === p
                      ? 'bg-itta-point text-white shadow-lg'
                      : 'bg-gray-50 dark:bg-white/5 text-gray-400'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="relative flex-1 flex items-center justify-center h-full overflow-hidden">
              {!isDirectInput && (
                <>
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-11 pointer-events-none border-y border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/2 z-0 rounded-lg" />
                  <div className="absolute inset-0 pointer-events-none z-20 bg-linear-to-b from-white dark:from-[#1c1c1c] via-transparent to-white dark:to-[#1c1c1c] opacity-95" />
                </>
              )}

              {isDirectInput ? (
                <div className="flex items-center gap-3 sm:gap-4 animate-in fade-in zoom-in-95 duration-200 z-30">
                  <input
                    type="number"
                    value={tempHour}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val >= 0 && val <= 23) {
                        setTempHour(val);
                        setTempPeriod(val >= 12 ? '오후' : '오전');
                      }
                    }}
                    className="w-14 sm:w-16 h-14 sm:h-16 text-center text-xl sm:text-2xl font-black rounded-2xl bg-gray-50 dark:bg-white/5 outline-none focus:ring-2 focus:ring-itta-point"
                    min="0"
                    max="23"
                  />
                  <span className="text-lg sm:text-xl font-bold text-gray-300">
                    :
                  </span>
                  <input
                    type="number"
                    value={tempMinute}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val >= 0 && val <= 59) {
                        setTempMinute(val);
                      }
                    }}
                    className="w-14 sm:w-16 h-14 sm:h-16 text-center text-xl sm:text-2xl font-black rounded-2xl bg-gray-50 dark:bg-white/5 outline-none focus:ring-2 focus:ring-itta-point"
                    min="0"
                    max="59"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <div
                    ref={hourScrollRef}
                    onScroll={handleHourScroll}
                    className="w-16 sm:w-20 h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory z-10"
                  >
                    <div style={{ height: SPACER_HEIGHT }} />
                    {[...Array(12)].map((_, i) => {
                      // 오전: 0-11, 오후: 12-23
                      const hour = tempPeriod === '오전' ? i : i + 12;
                      return (
                        <div
                          key={i}
                          className="flex items-center justify-center snap-center font-black transition-all h-12"
                        >
                          <span
                            className={
                              tempHour === hour
                                ? 'text-itta-point text-2xl'
                                : 'text-gray-300 dark:text-gray-600'
                            }
                          >
                            {hour.toString().padStart(2, '0')}
                          </span>
                        </div>
                      );
                    })}
                    <div style={{ height: SPACER_HEIGHT }} />
                  </div>

                  <div className="text-itta-gray2 font-bold z-10 mx-2 sm:mx-3">
                    :
                  </div>
                  <div
                    ref={minuteScrollRef}
                    onScroll={handleMinuteScroll}
                    className="w-16 sm:w-20 h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory z-10"
                  >
                    <div style={{ height: SPACER_HEIGHT }} />
                    {[...Array(60)].map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-center snap-center font-black transition-all h-12"
                      >
                        <span
                          className={
                            tempMinute === i
                              ? 'text-itta-point text-2xl'
                              : 'text-gray-300 dark:text-gray-600'
                          }
                        >
                          {i.toString().padStart(2, '0')}
                        </span>
                      </div>
                    ))}
                    <div style={{ height: SPACER_HEIGHT }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 sm:gap-3 relative z-30">
            <DrawerClose className="flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold bg-gray-100 dark:bg-white/5 text-gray-400 active:scale-95 transition-transform">
              취소
            </DrawerClose>
            <button
              onClick={handleApply}
              className="flex-2 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold bg-itta-black text-white dark:bg-white dark:text-black active:scale-95 transition-transform"
            >
              적용하기
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
