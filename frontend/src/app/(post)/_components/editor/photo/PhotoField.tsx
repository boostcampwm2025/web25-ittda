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

  const mediaIds = photos.mediaIds || [];
  const { data: resolvedData, isLoading } = useMediaResolveMulti(mediaIds, draftId);

  const urlMap = new Map(
    resolvedData?.items.map((item) => [item.mediaId, item.url]),
  );

  // mediaId 개수 기준으로 총 사진 수 계산 (로딩 중에도 개수 유지)
  const totalCount = mediaIds.length > 0 ? mediaIds.length : (photos.tempUrls?.length || 0);
  const hasMore = totalCount > MAX_VISIBLE;

  // URL 결정: tempUrl 우선, 없으면 resolved URL, 둘 다 없으면 null(스켈레톤)
  const photoSlots =
    mediaIds.length > 0
      ? mediaIds.slice(0, MAX_VISIBLE).map((id, i) => ({
          key: id,
          url: photos.tempUrls?.[i] || urlMap.get(id) || null,
        }))
      : (photos.tempUrls || []).slice(0, MAX_VISIBLE).map((url, i) => ({
          key: `temp-${i}`,
          url,
        }));

  // 사진이 하나도 없고 로딩 중도 아닌 경우
  if (totalCount === 0 && !isLoading)
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
        {photoSlots.map(({ key, url }, idx) => (
          <div
            key={`${key}-${idx}`}
            className="relative w-14 h-14 rounded-2xl border-4 border-white dark:border-[#121212] overflow-hidden shadow-sm transition-transform group-hover:translate-x-1 bg-gray-100 dark:bg-white/10"
            style={{ zIndex: 10 - idx }}
          >
            {url ? (
              <Image
                src={url}
                width={56}
                height={56}
                className="w-full h-full object-cover rounded-2xl"
                alt={`첨부 사진 ${idx + 1}`}
                unoptimized={true}
              />
            ) : (
              // URL 아직 로딩 중 — 스켈레톤
              <div className="w-full h-full animate-pulse bg-gray-200 dark:bg-white/20 rounded-2xl" />
            )}
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
