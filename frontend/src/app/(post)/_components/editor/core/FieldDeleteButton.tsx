'use client';

import { X } from 'lucide-react';

interface Props {
  onRemove: () => void;
  ariaLabel?: string;
}

//에디터 각 필드 우측에 위치하여 해당 블록을 삭제하는 버튼
export const FieldDeleteButton = ({
  onRemove,
  ariaLabel = '필드 삭제',
}: Props) => (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onRemove();
    }}
    className="flex items-center text-itta-gray2  hover:text-rose-500 dark:text-white transition-colors active:scale-90 flex-shrink-0"
    aria-label={ariaLabel}
  >
    <X className="w-3.5 h-3.5" />
  </button>
);
