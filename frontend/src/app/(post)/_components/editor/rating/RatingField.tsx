'use client';
import { Star, X } from 'lucide-react';

interface Props {
  value: number;
  max: number;
  onClick: () => void;
  onRemove: () => void;
}

export const RatingField = ({ value, max, onClick, onRemove }: Props) => {
  if (value === 0) return null;

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 shadow-sm transition-all w-fit">
      <button
        onClick={onClick}
        className="flex items-center gap-1.5 active:scale-95 transition-transform"
      >
        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        <span className="flex items-center text-xs font-bold text-itta-black dark:text-gray-300 leading-none">
          {value} / {max}
        </span>
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="flex items-center text-itta-gray2 hover:text-rose-500 transition-colors active:scale-90"
        aria-label="별점 삭제"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
