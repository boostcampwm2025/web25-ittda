'use client';
import { Star } from 'lucide-react';
import {
  FieldDefaultButton,
  FieldDefaultButtonIcon,
  FieldDefaultButtonLabel,
} from '../core/FieldDefaultButton';
import { FieldDeleteButton } from '../core/FieldDeleteButton';
import { RatingValue } from '@/lib/types/record';

interface Props {
  value: RatingValue;
  onClick: () => void;
  onRemove: () => void;
}
const MAX_VALUE = 5;
export const RatingField = ({ value, onClick, onRemove }: Props) => {
  //데이터가 없을 때
  if (value.rating === 0)
    return (
      <div className="flex items-center gap-2 w-full py-1 group">
        <FieldDefaultButton onClick={onClick}>
          <FieldDefaultButtonIcon icon={Star} />
          <FieldDefaultButtonLabel>평점 매기기</FieldDefaultButtonLabel>
        </FieldDefaultButton>
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
          {value.rating} / {MAX_VALUE}
        </span>
      </button>
      <FieldDeleteButton onRemove={onRemove} ariaLabel="별점 필드 삭제" />
    </div>
  );
};
