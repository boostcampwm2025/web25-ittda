'use client';

import { Check, Star } from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { cn } from '@/lib/utils';

interface Rating {
  value: number;
  max: number;
}

interface RatingDrawerProps {
  onClose: () => void;
  rating: Rating;
  onUpdateRating: (val: Rating) => void;
}

export default function RatingDrawer({
  onClose,
  rating,
  onUpdateRating,
}: RatingDrawerProps) {
  // TODO: 별점의 최대값에 따라 변경
  const currentMax = rating.max || 5;

  return (
    <Drawer open={true} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <div className=" max-w-sm mx-auto w-full px-8 pt-4 pb-10">
          <DrawerHeader className="px-0 items-start text-left">
            <DrawerTitle className="text-xl font-bold dark:text-white text-itta-black">
              평가 남기기
            </DrawerTitle>
          </DrawerHeader>

          <div className="flex flex-col items-center gap-8 my-4">
            <div
              className={cn(
                'flex flex-wrap justify-center gap-2',
                currentMax > 5 ? 'max-w-[280px]' : 'w-full',
              )}
            >
              {[...Array(currentMax)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => onUpdateRating({ ...rating, value: i + 1 })}
                  className="transition-transform active:scale-125 group"
                >
                  <Star
                    className={cn(
                      'transition-colors',
                      // max 수치에 따른 크기 최적화
                      currentMax > 5 ? 'w-8 h-8' : 'w-10 h-10',
                      i < rating.value
                        ? 'fill-[#FACC15] text-[#FACC15]'
                        : 'text-gray-200 dark:text-white/10',
                    )}
                  />
                </button>
              ))}
            </div>

            {/* 수치 표시 영역 */}
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-[#10B981]">
                {rating.value}
              </span>
              <span className="text-xl font-bold text-gray-300">
                / {currentMax}
              </span>
            </div>
          </div>

          <DrawerClose
            className="mt-8 flex w-full py-4 rounded-2xl text-sm font-bold bg-itta-black text-white dark:bg-white dark:text-black shadow-xl active:scale-95 items-center justify-center gap-2"
            onClick={onClose}
          >
            <Check className="w-5 h-5" />
            확인
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
