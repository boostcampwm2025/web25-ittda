import { useCallback } from 'react';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import type { Marker } from '@googlemaps/markerclusterer';
import type { PostListItem } from '@/lib/types/post';
import Image from 'next/image';

export type PinMarkerProps = {
  post: PostListItem;
  onClick: (id: string) => void;
  setMarkerRef: (marker: Marker | null, key: string) => void;
};

export const PinMarker = ({ post, onClick, setMarkerRef }: PinMarkerProps) => {
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
      <div className="relative w-12 h-12 bg-secondary rounded-full rounded-br-none transform rotate-45 border-[3px] border-secondary overflow-hidden">
        {post.imageUrl && (
          <Image
            src={post.imageUrl || '../../../../public/profile-ex.jpeg'}
            alt="Pin Image"
            fill
            sizes="48px"
            className="object-cover transform -rotate-45 scale-125"
          />
        )}
      </div>
    </AdvancedMarker>
  );
};
