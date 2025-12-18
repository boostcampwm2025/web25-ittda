import { useMap } from '@vis.gl/react-google-maps';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { type Marker, MarkerClusterer } from '@googlemaps/markerclusterer';
import type { PostListItem } from '@/lib/types/post';
import { PinMarker } from './PinMarker';

export const ClusteredPostMarkers = ({
  posts,
  onSelectPost,
}: {
  posts: PostListItem[];
  onSelectPost: (id: string) => void;
}) => {
  const [markers, setMarkers] = useState<{ [key: string]: Marker }>({});
  const map = useMap();

  // 클러스터러 초기화
  const clusterer = useMemo(() => {
    if (!map) return null;
    return new MarkerClusterer({ map });
  }, [map]);

  // 마커가 변경될 때마다 클러스터러 업데이트
  useEffect(() => {
    if (!clusterer) return;
    clusterer.clearMarkers();
    clusterer.addMarkers(Object.values(markers));
  }, [clusterer, markers]);

  // 각 PinMarker가 마운트/언마운트될 때 마커 객체 수집/삭제
  const setMarkerRef = useCallback((marker: Marker | null, key: string) => {
    setMarkers((prev) => {
      if ((marker && prev[key]) || (!marker && !prev[key])) return prev;
      if (marker) {
        return { ...prev, [key]: marker };
      } else {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
    });
  }, []);

  return (
    <>
      {posts.map((post) => (
        <PinMarker
          key={post.id}
          post={post}
          onClick={onSelectPost}
          setMarkerRef={setMarkerRef}
        />
      ))}
    </>
  );
};
