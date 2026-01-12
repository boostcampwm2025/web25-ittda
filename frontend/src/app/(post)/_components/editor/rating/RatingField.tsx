'use client';
import { Star } from 'lucide-react';
import PlaceholderButton from '../core/FieldDefaultButton';
import { FieldDeleteButton } from '../core/FieldDeleteButton';

interface Props {
  value: number;
  max: number;
  onClick: () => void;
  onRemove: () => void;
}

export const RatingField = ({ value, max, onClick, onRemove }: Props) => {
  //데이터가 없을 때
  if (value === 0)
    return (
      <div className="flex items-center gap-2 w-full py-1 group">
        <PlaceholderButton icon={Star} label="평점 매기기" onClick={onClick} />
        <FieldDeleteButton onRemove={onRemove} ariaLabel="별점 필드 삭제" />
      </div>
    );

  // 데이터가 있을 때
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
      <FieldDeleteButton onRemove={onRemove} ariaLabel="별점 필드 삭제" />
    </div>
  );
};
