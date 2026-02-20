'use client';

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { EMOTIONS } from '@/lib/constants/constants';
import { MoodValue } from '@/lib/types/record';
import { Emotion } from '@/lib/types/recordField';

interface EmotionDrawerProps {
  onClose: () => void;
  isOpen: boolean;
  onSelect: (emotion: string) => void;
  selectedEmotion: MoodValue | string[] | null;
  mode?: 'edit' | 'search';
  onReset?: () => void;
}

export default function EmotionDrawer({
  onClose,
  isOpen,
  onSelect,
  selectedEmotion,
  mode = 'edit',
  onReset,
}: EmotionDrawerProps) {
  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <div className="mx-auto w-full px-6 sm:px-8 pt-4 pb-10 sm:pb-12">
          <DrawerHeader className="px-0 mb-1 sm:mb-2">
            <div className="flex flex-col text-left">
              <span className="text-[10px] sm:text-[11px] font-bold text-[#10B981] uppercase tracking-[0.2em] sm:tracking-widest leading-none mb-1">
                SELECT EMOTION
              </span>
              <DrawerTitle className="text-base sm:text-lg font-bold">
                {mode === 'edit' ? '지금 기분이 어떠신가요?' : '감정으로 검색'}
              </DrawerTitle>
            </div>
          </DrawerHeader>

          <div className="grid grid-cols-5 gap-2 sm:gap-4 mb-6 sm:mb-8">
            {EMOTIONS.map((emo: Emotion) => {
              const isSelected = Array.isArray(selectedEmotion)
                ? selectedEmotion.includes(emo.label)
                : selectedEmotion &&
                  !Array.isArray(selectedEmotion) &&
                  (selectedEmotion as MoodValue).mood === emo.label;
              return (
                <button
                  key={emo.label}
                  onClick={() => onSelect(emo.label)}
                  className={`flex flex-col items-center gap-1 sm:gap-2 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl transition-all active:scale-90 ${
                    isSelected
                      ? 'bg-[#10B981]/10 ring-1 ring-[#10B981]'
                      : 'hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}
                >
                  <span className="text-xl sm:text-2xl">{emo.emoji}</span>
                  <span className="text-[8px] sm:text-[9px] font-bold text-gray-400 whitespace-nowrap">
                    {emo.label}
                  </span>
                </button>
              );
            })}
          </div>
          <section className="flex flex-row w-full gap-2 sm:gap-3">
            {mode === 'search' && (
              <button
                onClick={onReset}
                className="flex-1 py-3 sm:py-4 bg-white dark:bg-white/5 border border-gray-50 dark:border-white/5 rounded-2xl text-itta-point font-bold text-xs sm:text-sm shadow-sm active:scale-95 transition-all"
              >
                초기화
              </button>
            )}
            <DrawerClose className="flex-1 w-full py-3 sm:py-4 rounded-2xl font-bold text-xs sm:text-sm bg-[#333333] text-white active:scale-95 transition-transform dark:bg-white dark:text-black">
              확인
            </DrawerClose>
          </section>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
