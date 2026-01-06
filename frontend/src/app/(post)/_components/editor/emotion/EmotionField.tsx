'use client';
import { Emotion } from '@/lib/types/recordField';
import { X } from 'lucide-react';

interface EmotionFieldProps {
  emotion: Emotion | null;
  onClick: () => void;
  onRemove: () => void;
}

export const EmotionField = ({
  emotion,
  onClick,
  onRemove,
}: EmotionFieldProps) => {
  if (!emotion) return null;

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 shadow-sm transition-all w-fit">
      <button
        onClick={onClick}
        className="flex items-center gap-1 active:scale-95 transition-transform"
      >
        <span className="flex items-center text-lg leading-none select-none">
          {emotion.emoji}
        </span>
        <span className="flex items-center text-xs font-bold text-itta-black dark:text-gray-300 leading-none">
          {emotion.label}
        </span>
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="flex items-center text-itta-gray2 hover:text-rose-500 transition-colors active:scale-90"
        aria-label="감정 삭제"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
