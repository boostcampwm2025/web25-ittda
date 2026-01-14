'use client';

import {
  FieldDefaultButton,
  FieldDefaultButtonIcon,
  FieldDefaultButtonLabel,
} from '@/app/(post)/_components/editor/core/FieldDefaultButton';
import { FieldDeleteButton } from '@/app/(post)/_components/editor/core/FieldDeleteButton';
import { MapPin } from 'lucide-react';

interface LocationFieldProps {
  address?: string;
  onClick: () => void;
  onRemove: () => void;
}

export function LocationField({
  address,
  onClick,
  onRemove,
}: LocationFieldProps) {
  return (
    <div className="flex items-center gap-2 w-full py-1 group">
      {!address ? (
        <FieldDefaultButton onClick={onClick}>
          <FieldDefaultButtonIcon icon={MapPin} />
          <FieldDefaultButtonLabel>장소 추가하기</FieldDefaultButtonLabel>
        </FieldDefaultButton>
      ) : (
        <div
          onClick={onClick}
          className="flex items-center gap-2 cursor-pointer flex-1 min-w-0 px-1"
        >
          <MapPin className="w-3.5 h-3.5 text-itta-point flex-shrink-0" />
          <span className="font-bold text-xs text-itta-black dark:text-white truncate">
            {address}
          </span>
        </div>
      )}

      <FieldDeleteButton onRemove={onRemove} ariaLabel="위치 필드 삭제" />
    </div>
  );
}
