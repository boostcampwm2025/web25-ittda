'use client';

import { useState, useRef, useEffect } from 'react';
import { Star } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { RatingValue } from '@/lib/types/recordField';
import { useThrottle } from '@/lib/utils/useThrottle';

interface RatingDrawerProps {
  onClose: (finalValue?: RatingValue) => void;
  rating: RatingValue;
  onUpdateRating: (val: RatingValue) => void;
}

export default function RatingDrawer({
  onClose,
  rating,
  onUpdateRating,
}: RatingDrawerProps) {
  const [localValue, setLocalValue] = useState(rating.rating);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentMax = 5;

  const { throttled: throttledUpdate, flush: flushUpdate } = useThrottle(
    (val: number) => {
      onUpdateRating({ rating: val });
    },
    500,
  );

  // 소수점 지원을 위해 좌표로 점수 계산
  const calculateScore = (clientX: number) => {
    if (!containerRef.current) return;

    const { left, width } = containerRef.current.getBoundingClientRect();
    const x = clientX - left;

    // 0에서 Max 사이로 계산 -> 0.1 단위 반올림
    let rawScore = (x / width) * currentMax;
    rawScore = Math.max(0, Math.min(currentMax, rawScore));
    const finalScore = Math.round(rawScore * 10) / 10;

    setLocalValue(finalScore);
    throttledUpdate(finalScore);
  };

  // PC용 마우스 이벤트 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    calculateScore(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    calculateScore(e.clientX);
  };

  // 모바일용 터치 이벤트 핸들러
  const handleTouchMove = (e: React.TouchEvent) => {
    calculateScore(e.touches[0].clientX);
  };

  // 드래그 종료
  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handleConfirm = () => {
    // 대기 중인 쓰로틀링 업데이트를 먼저 실행
    flushUpdate();
    onUpdateRating({ rating: localValue });
    onClose({ rating: localValue });
  };

  return (
    <Drawer
      open={true}
      onOpenChange={(open) => {
        if (!open) {
          flushUpdate();
          onClose();
        }
      }}
    >
      <DrawerContent>
        <div className="w-full px-6 sm:px-8 pt-3 sm:pt-4 pb-10 sm:pb-12">
          <DrawerHeader className="px-0 items-start text-left">
            <div className="flex flex-col text-left">
              <span className="text-[10px] sm:text-[11px] font-bold text-[#10B981] uppercase tracking-[0.2em] sm:tracking-widest leading-none mb-1">
                SELECT RATING
              </span>
              <DrawerTitle className="text-base sm:text-lg font-bold">
                평가 남기기
              </DrawerTitle>
            </div>
          </DrawerHeader>

          <div className="flex flex-col items-center gap-6 sm:gap-8 my-3 sm:my-4">
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onTouchStart={() => setIsDragging(true)}
              onTouchMove={handleTouchMove}
              onTouchEnd={() => setIsDragging(false)}
              className="relative cursor-pointer touch-none select-none py-3 sm:py-4"
            >
              <div className="flex gap-1 sm:gap-1.5">
                {[...Array(currentMax)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-10 sm:w-12 h-10 sm:h-12 text-gray-200 dark:text-white/10 fill-transparent"
                  />
                ))}
              </div>

              <div
                className="absolute top-3 sm:top-4 left-0 flex gap-1 sm:gap-1.5 overflow-hidden pointer-events-none transition-all duration-75 ease-out"
                style={{ width: `${(localValue / currentMax) * 100}%` }}
              >
                {[...Array(currentMax)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-10 sm:w-12 h-10 sm:h-12 fill-[#FACC15] text-[#FACC15] shrink-0"
                  />
                ))}
              </div>
            </div>

            {/* 수치 표시 영역 */}
            <div className="flex flex-col items-center gap-0.5 sm:gap-1">
              <div className="flex items-baseline gap-0.5 sm:gap-1">
                <span className="text-5xl sm:text-6xl font-black text-[#10B981] tabular-nums">
                  {localValue.toFixed(1)}
                </span>
                <span className="text-lg sm:text-xl font-bold text-gray-300">
                  / {currentMax}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleConfirm}
            className="mt-6 sm:mt-8 flex w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold bg-itta-black text-white dark:bg-white dark:text-black shadow-xl active:scale-95 items-center justify-center"
          >
            확인
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
