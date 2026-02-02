'use client';

import { useCallback, useState } from 'react';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import type { Marker } from '@googlemaps/markerclusterer';
import type { MapPostItem } from '@/lib/types/record';
import AssetImage from '@/components/AssetImage';
import { cn } from '@/lib/utils';
import { randomBaseImage } from '@/lib/image';

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
  const [isError, setIsError] = useState(false);
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

  return (
    <AdvancedMarker
      position={{ lat: Number(post.lat), lng: Number(post.lng) }}
      ref={ref}
      onClick={handleClick}
      zIndex={isSelected ? 500 : undefined}
    >
      <div
        className={cn(
          'flex justify-center items-center relative bg-secondary rounded-full rounded-br-none transform rotate-45 overflow-hidden transition-all duration-300',
          isSelected
            ? 'w-14 h-14 border-2 border-[#10B981] shadow-lg scale-110'
            : 'w-11 h-11 border-[1.5px] border-secondary',
        )}
      >
        <AssetImage
          assetId={post.thumbnailMediaId ?? randomBaseImage(post.id)}
          alt={post.title}
          fill
          sizes={isSelected ? '64px' : '48px'}
          className="object-cover transform -rotate-45 scale-125"
          onError={() => setIsError(true)}
        />
      </div>
    </AdvancedMarker>
  );
};
