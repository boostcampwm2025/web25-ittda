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
    <div className="flex items-center gap-1 group/rating">
      <div
        onClick={onClick}
        className="flex items-center gap-1.5 px-2 py-2 bg-gray-50 dark:bg-white/5 rounded-md border border-gray-100 dark:border-white/10 active:scale-95 transition-all w-fit"
      >
        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        <span className="text-xs font-bold text-itta-black dark:text-gray-300">
          {value} / {max}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:text-rose-500 rounded-md text-itta-gray2 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
