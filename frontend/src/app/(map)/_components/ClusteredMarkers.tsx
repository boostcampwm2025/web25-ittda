'use client';

import { useMap } from '@vis.gl/react-google-maps';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type Marker, MarkerClusterer } from '@googlemaps/markerclusterer';
import type { MapPostItem } from '@/lib/types/record';
import { PinMarker } from './PinMarker';

// 클러스터 이벤트 타입용
interface ClusterClickEvent {
  cluster: {
    markers: Marker[];
  };
}

export const ClusteredPostMarkers = ({
  posts,
  onSelectPost,
  selectedPostId,
}: {
  posts: MapPostItem[];
  onSelectPost: (id: string | string[] | null) => void;
  selectedPostId: string | string[] | null;
}) => {
  const [markers, setMarkers] = useState<{ [key: string]: Marker }>({});
  const map = useMap();
  const markerIdMap = useRef(new Map<Marker, string>());

  const clusterer = useMemo(() => {
    if (!map) return null;
    return new MarkerClusterer({ map });
  }, [map]);

  // 클러스터 클릭 이벤트 핸들러
  useEffect(() => {
    if (!clusterer) return;

    const clickListener = clusterer.addListener(
      'click',
      (event: ClusterClickEvent) => {
        if (!event.cluster) return null;
        const clusterMarkers: Marker[] = event.cluster.markers;

        if (clusterMarkers && clusterMarkers.length > 0) {
          const ids = clusterMarkers
            .map((m) => markerIdMap.current.get(m))
            .filter((id): id is string => !!id);

          if (ids.length > 0) {
            onSelectPost(ids);
          }
        }
      },
    );

    return () => {
      // 리스너 제거
      google.maps.event.removeListener(clickListener);
    };
  }, [clusterer, onSelectPost]);

  // 마커 데이터 변경 시 클러스터러 반영
  useEffect(() => {
    if (!clusterer) return;

    clusterer.clearMarkers();
    clusterer.addMarkers(Object.values(markers));
  }, [clusterer, markers]);

  const setMarkerRef = useCallback((marker: Marker | null, key: string) => {
    setMarkers((prev) => {
      if ((marker && prev[key] === marker) || (!marker && !prev[key]))
        return prev;

      if (marker) {
        markerIdMap.current.set(marker, key);
        return { ...prev, [key]: marker };
      } else {
        const existingMarker = prev[key];
        if (existingMarker) markerIdMap.current.delete(existingMarker);

        const next = { ...prev };
        delete next[key];
        return next;
      }
    });
  }, []);

  return (
    <>
      {posts.map((post) => {
        const isSelected =
          selectedPostId === post.id ||
          (Array.isArray(selectedPostId) && selectedPostId.includes(post.id));
        return (
          <PinMarker
            key={post.id}
            post={post}
            onClick={(id) => onSelectPost(id)}
            setMarkerRef={setMarkerRef}
            isSelected={isSelected}
          />
        );
      })}
    </>
  );
};
