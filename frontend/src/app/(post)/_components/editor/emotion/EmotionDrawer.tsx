'use client';

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { EMOTIONS } from '@/lib/constants/constants';

interface EmotionDrawerProps {
  onClose: () => void;
  onSelect: (emotion: { emoji: string; label: string }) => void;
  selectedEmotion: { emoji: string; label: string } | null;
}

export default function EmotionDrawer({
  onClose,
  onSelect,
  selectedEmotion,
}: EmotionDrawerProps) {
  return (
    <Drawer open={true} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <div className="max-w-sm mx-auto w-full p-8 pb-12">
          <DrawerHeader className="px-0 mb-6">
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-widest leading-none mb-1">
                SELECT EMOTION
              </span>
              <DrawerTitle className="text-lg font-bold">
                지금 기분이 어떠신가요?
              </DrawerTitle>
            </div>
          </DrawerHeader>

          <div className="grid grid-cols-5 gap-4 mb-8">
            {EMOTIONS.map((emo) => {
              const isSelected = selectedEmotion?.label === emo.label;
              return (
                <button
                  key={emo.label}
                  onClick={() => {
                    onSelect(emo);
                    onClose();
                  }}
                  className={`flex flex-col items-center gap-2 p-2 rounded-2xl transition-all active:scale-90 ${
                    isSelected
                      ? 'bg-[#10B981]/10 ring-1 ring-[#10B981]'
                      : 'hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}
                >
                  <span className="text-2xl">{emo.emoji}</span>
                  <span className="text-[9px] font-bold text-gray-400 whitespace-nowrap">
                    {emo.label}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={onClose}
            className="w-full py-4 rounded-2xl font-bold text-sm bg-[#333333] text-white dark:bg-white dark:text-[#121212] active:scale-95 transition-transform"
          >
            닫기
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
