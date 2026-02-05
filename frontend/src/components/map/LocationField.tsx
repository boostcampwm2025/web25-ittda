'use client';

import {
  FieldDefaultButton,
  FieldDefaultButtonIcon,
  FieldDefaultButtonLabel,
} from '@/app/(post)/_components/editor/core/FieldDefaultButton';
import { FieldDeleteButton } from '@/app/(post)/_components/editor/core/FieldDeleteButton';
import { LocationValue } from '@/lib/types/recordField';
import { MapPin } from 'lucide-react';

interface LocationFieldProps {
  location?: LocationValue;
  onClick: () => void;
  onRemove: () => void;
}

export function LocationField({
  location,
  onClick,
  onRemove,
}: LocationFieldProps) {
  const address = location?.address;
  const placeName = location?.placeName;
  return (
    <div className="flex items-center justify-end gap-2 py-1 group">
      {!address ? (
        <FieldDefaultButton onClick={onClick}>
          <FieldDefaultButtonIcon icon={MapPin} />
          <FieldDefaultButtonLabel>장소 추가하기</FieldDefaultButtonLabel>
        </FieldDefaultButton>
      ) : (
        <div
          onClick={onClick}
          className="flex items-center gap-2 cursor-pointer min-w-0 px-1"
        >
          <MapPin className="w-3.5 h-3.5 text-itta-point shrink-0" />
          <span className="font-bold text-xs text-itta-black dark:text-white truncate">
            {placeName || address}
          </span>
        </div>
      )}

      <FieldDeleteButton onRemove={onRemove} ariaLabel="위치 필드 삭제" />
    </div>
  );
}
