'use client';

import { useCallback } from 'react';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import type { Marker } from '@googlemaps/markerclusterer';
import type { MapPostItem } from '@/lib/types/record';
import AssetImage from '@/components/AssetImage';
import { cn } from '@/lib/utils';
import { randomBaseImage } from '@/lib/image';
import { Map as MapIcon } from 'lucide-react';

export type PinMarkerProps = {
  post: MapPostItem;
  onClick: (id: string) => void;
  setMarkerRef: (marker: Marker | null, key: string) => void;
  isSelected?: boolean;
};

export const PinMarker = ({
  post,
  onClick,
  setMarkerRef,
  isSelected = false,
}: PinMarkerProps) => {
  const handleClick = useCallback(
    () => requestAnimationFrame(() => onClick(post.id)),
    [onClick, post.id],
  );

  // AdvancedMarker의 실제 구글 객체를 부모의 clusterer에 등록하기 위한 ref
  const ref = useCallback(
    (marker: google.maps.marker.AdvancedMarkerElement) =>
      setMarkerRef(marker, post.id),
    [setMarkerRef, post.id],
  );

  const hasThumbnail = (post.previewMediaIds?.length ?? 0) > 0;

  return (
    <AdvancedMarker
      position={{ lat: Number(post.lat), lng: Number(post.lng) }}
      ref={ref}
      onClick={handleClick}
      zIndex={isSelected ? 500 : undefined}
    >
      <div
        // 클러스터 마커(CustomClusterRenderer)가 대표 사진을 고를 때 이 값들을
        data-preview-media-id={post.previewMediaIds?.[0] ?? ''}
        data-created-at={post.createdAt}
        className={cn(
          'flex justify-center items-center relative rounded-full rounded-br-none transform rotate-45 overflow-hidden transition-all duration-300',
          hasThumbnail ? 'bg-secondary' : 'bg-white',
          isSelected
            ? 'w-12 h-12 sm:w-14 sm:h-14 border-2 border-[#10B981] shadow-lg scale-110'
            : 'w-10 h-10 sm:w-11 sm:h-11 border-[1.5px] border-secondary',
        )}
      >
        {hasThumbnail ? (
          <AssetImage
            assetId={post.previewMediaIds?.[0] ?? randomBaseImage(post.id)}
            alt={post.title}
            fill
            sizes={
              isSelected
                ? '(max-width: 640px) 48px, 56px'
                : '(max-width: 640px) 40px, 44px'
            }
            className="object-cover transform -rotate-45 scale-125"
            loading="eager"
            noSkeleton
          />
        ) : (
          <MapIcon
            className={cn(
              'text-gray-600 transform -rotate-45',
              isSelected ? 'w-6 h-6 sm:w-7 sm:h-7' : 'w-5 h-5 sm:w-6 sm:h-6',
            )}
          />
        )}
      </div>
    </AdvancedMarker>
  );
};
