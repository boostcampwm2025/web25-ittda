'use client';

import PlaceholderButton from '@/app/(post)/_components/editor/core/FieldDefaultButton';
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
        <PlaceholderButton
          icon={MapPin}
          label="장소 추가하기"
          onClick={onClick}
        />
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
