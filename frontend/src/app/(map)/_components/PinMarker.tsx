'use client';

import { useCallback, useState } from 'react';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import type { Marker } from '@googlemaps/markerclusterer';
import type { MapPostItem } from '@/lib/types/record';
import AssetImage from '@/components/AssetImage';
import { cn } from '@/lib/utils';
import { ImageIcon } from 'lucide-react';

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
  const handleClick = useCallback(() => onClick(post.id), [onClick, post.id]);

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
      zIndex={isSelected ? 1000 : undefined}
    >
      <div
        className={cn(
          'flex justify-center items-center relative bg-white rounded-full rounded-br-none transform rotate-45 overflow-hidden transition-all duration-300',
          isSelected
            ? 'w-16 h-16 border-4 border-[#10B981] shadow-lg scale-110'
            : 'w-12 h-12 border-[3px] border-secondary',
        )}
      >
        {post.thumbnailUrl && !isError ? (
          <AssetImage
            assetId={post.id}
            alt={post.title}
            fill
            sizes={isSelected ? '64px' : '48px'}
            className="object-cover transform -rotate-45 scale-125"
            onError={() => setIsError(true)}
          />
        ) : (
          /* 이미지가 없거나 로딩에 실패했을 때 */
          <div className="transform -rotate-45 overflow-hidden transition-all duration-300 flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-gray-400" />
          </div>
        )}
      </div>
    </AdvancedMarker>
  );
};
