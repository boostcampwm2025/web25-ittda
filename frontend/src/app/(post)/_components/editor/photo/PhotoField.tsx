'use client';

import { ImageIcon } from 'lucide-react';
import Image from 'next/image';
import {
  FieldDefaultButton,
  FieldDefaultButtonIcon,
  FieldDefaultButtonLabel,
} from '../core/FieldDefaultButton';
import { FieldDeleteButton } from '../core/FieldDeleteButton';
import { PhotoValue } from '@/lib/types/recordField';
import { useMediaResolveMulti } from '@/hooks/useMediaResolve';

interface Props {
  photos: PhotoValue;
  onClick: () => void;
  onRemove: () => void;
  draftId?: string;
}

export const PhotoField = ({ photos, onClick, onRemove, draftId }: Props) => {
  const MAX_VISIBLE = 3;

  // URL 변환
  const mediaIds = photos.mediaIds || [];
  const { data: resolvedData } = useMediaResolveMulti(mediaIds, draftId);

  // resolve 된 url
  const urlMap = new Map(
    resolvedData?.items.map((item) => [item.mediaId, item.url]),
  );

  // 전체 사진
  const allPhotos = [
    ...(photos.tempUrls || []),
    ...(mediaIds.map((id) => urlMap.get(id)).filter(Boolean) as string[]),
  ];

  const totalCount = allPhotos.length;
  const hasMore = totalCount > MAX_VISIBLE;

  // 사진이 하나도 없는 경우
  if (totalCount === 0)
    return (
      <div className="flex items-center gap-2 w-full py-1 group">
        <FieldDefaultButton onClick={onClick}>
          <FieldDefaultButtonIcon icon={ImageIcon} />
          <FieldDefaultButtonLabel>사진 추가하기</FieldDefaultButtonLabel>
        </FieldDefaultButton>
        <FieldDeleteButton onRemove={onRemove} ariaLabel="사진 필드 삭제" />
      </div>
    );

  return (
    <div
      className="flex items-center gap-2 w-full cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex -space-x-4 overflow-hidden py-1">
        {allPhotos.slice(0, MAX_VISIBLE).map((url, idx) => (
          <div
            key={`${url}-${idx}`}
            className="relative w-14 h-14 rounded-2xl border-4 border-white dark:border-[#121212] overflow-hidden shadow-sm transition-transform group-hover:translate-x-1"
            style={{ zIndex: 10 - idx }}
          >
            <Image
              src={url}
              width={56}
              height={56}
              className="object-cover rounded-2xl"
              alt={`첨부 사진 ${url}`}
              unoptimized={true}
            />
            {idx === MAX_VISIBLE - 1 && hasMore && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white text-xs font-black">
                  +{totalCount - MAX_VISIBLE}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 텍스트 정보 */}
      <div className="flex flex-col items-start gap-0.5 ml-2">
        <span className="text-sm font-bold dark:text-gray-300 text-itta-black">
          사진 {totalCount}장
        </span>
        <span className="text-xs font-bold text-itta-point uppercase tracking-tighter">
          Manage Photo
        </span>
      </div>
    </div>
  );
};
