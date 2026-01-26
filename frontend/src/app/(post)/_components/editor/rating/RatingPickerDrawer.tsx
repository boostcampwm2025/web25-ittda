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
  onClose: () => void;
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

  const throttledUpdate = useThrottle((val: number) => {
    onUpdateRating({ rating: val });
  }, 500);

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

  return (
    <Drawer open={true} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <div className="w-full px-8 pt-4 pb-10">
          <DrawerHeader className="px-0 items-start text-left">
            <DrawerTitle className="text-xl font-bold dark:text-white text-itta-black">
              평가 남기기
            </DrawerTitle>
          </DrawerHeader>

          <div className="flex flex-col items-center gap-8 my-4">
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onTouchStart={() => setIsDragging(true)}
              onTouchMove={handleTouchMove}
              onTouchEnd={() => setIsDragging(false)}
              className="relative cursor-pointer touch-none select-none py-4"
            >
              <div className="flex gap-1">
                {[...Array(currentMax)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-12 h-12 text-gray-200 dark:text-white/10 fill-transparent"
                  />
                ))}
              </div>

              <div
                className="absolute top-4 left-0 flex gap-1 overflow-hidden pointer-events-none transition-all duration-75 ease-out"
                style={{ width: `${(localValue / currentMax) * 100}%` }}
              >
                {[...Array(currentMax)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-12 h-12 fill-[#FACC15] text-[#FACC15] flex-shrink-0"
                  />
                ))}
              </div>
            </div>

            {/* 수치 표시 영역 */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-baseline gap-1">
                <span className="text-6xl font-black text-[#10B981] tabular-nums">
                  {localValue.toFixed(1)}
                </span>
                <span className="text-xl font-bold text-gray-300">
                  / {currentMax}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="mt-8 flex w-full py-4 rounded-2xl text-sm font-bold bg-itta-black text-white dark:bg-white dark:text-black shadow-xl active:scale-95 items-center justify-center"
          >
            확인
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
