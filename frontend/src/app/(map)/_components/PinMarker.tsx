'use client';

import { useCallback, useState } from 'react';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import type { Marker } from '@googlemaps/markerclusterer';
import type { MapPostItem } from '@/lib/types/record';
import AssetImage from '@/components/AssetImage';

export type PinMarkerProps = {
  post: MapPostItem;
  onClick: (id: string) => void;
  setMarkerRef: (marker: Marker | null, key: string) => void;
};

export const PinMarker = ({ post, onClick, setMarkerRef }: PinMarkerProps) => {
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
    >
      <div className="relative w-12 h-12 bg-white rounded-full rounded-br-none transform rotate-45 border-[3px] border-secondary overflow-hidden">
        {post.imageUrl && !isError ? (
          <AssetImage
            assetId={post.imageUrl}
            alt={post.title}
            fill
            sizes="48px"
            className="object-cover transform -rotate-45 scale-125"
            onError={() => setIsError(true)}
          />
        ) : (
          /* 이미지가 없거나 로딩에 실패했을 때 */
          <div className="w-full h-full bg-white"></div>
        )}
      </div>
    </AdvancedMarker>
  );
};
