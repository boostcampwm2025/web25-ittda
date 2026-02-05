'use client';
import { EMOTION_MAP } from '@/lib/constants/constants';
import { Smile } from 'lucide-react';

import { FieldDeleteButton } from '../core/FieldDeleteButton';
import {
  FieldDefaultButton,
  FieldDefaultButtonIcon,
  FieldDefaultButtonLabel,
} from '../core/FieldDefaultButton';
import { EmotionValue } from '@/lib/types/recordField';

interface EmotionFieldProps {
  emotion: EmotionValue | null;
  onClick: () => void;
  onRemove: () => void;
}

export const EmotionField = ({
  emotion,
  onClick,
  onRemove,
}: EmotionFieldProps) => {
  if (!emotion)
    return (
      <div className="flex items-center gap-2 w-full py-1 group">
        <FieldDefaultButton onClick={onClick}>
          <FieldDefaultButtonIcon icon={Smile} />
          <FieldDefaultButtonLabel>지금 기분은?</FieldDefaultButtonLabel>
        </FieldDefaultButton>

        <FieldDeleteButton onRemove={onRemove} ariaLabel="감정 필드 삭제" />
      </div>
    );

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 shadow-sm transition-all w-fit">
      <button
        onClick={onClick}
        className="flex items-center gap-1 active:scale-95 transition-transform"
      >
        <span className="flex items-center text-lg leading-none select-none">
          {EMOTION_MAP[emotion.mood]}
        </span>
        <span className="flex items-center text-xs font-bold text-itta-black dark:text-gray-300 leading-none">
          {emotion.mood}
        </span>
      </button>
      <FieldDeleteButton onRemove={onRemove} ariaLabel="감정 필드 삭제" />
    </div>
  );
};
