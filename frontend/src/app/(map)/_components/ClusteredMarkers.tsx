'use client';

import { useMap } from '@vis.gl/react-google-maps';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type Marker, MarkerClusterer } from '@googlemaps/markerclusterer';
import type { MapPostItem } from '@/lib/types/record';
import { PinMarker } from './PinMarker';
import { CustomClusterRenderer } from './CustomClusterRenderer';

// 현재 줌에서 targetZoom까지 한 단계씩 부드럽게 확대
function smoothZoom(
  map: google.maps.Map,
  targetZoom: number,
  onComplete?: () => void,
) {
  const currentZoom = map.getZoom() ?? 0;
  if (currentZoom >= targetZoom) {
    onComplete?.();
    return;
  }
  google.maps.event.addListenerOnce(map, 'zoom_changed', () => {
    smoothZoom(map, targetZoom, onComplete);
  });
  setTimeout(() => {
    map.setZoom(currentZoom + 1);
  }, 80);
}

// 클러스터 이벤트 타입용
interface ClusterClickEvent {
  markers?: Marker[];
  position?: google.maps.LatLng;
  bounds?: google.maps.LatLngBounds;
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
  const mapRef = useRef(map);
  const markerIdMap = useRef(new Map<Marker, string>());
  const clustererMarkersRef = useRef<Set<Marker>>(new Set());

  useEffect(() => {
    mapRef.current = map;
  }, [map]);

  const clusterer = useMemo(() => {
    if (!map) return null;
    return new MarkerClusterer({
      map,
      renderer: new CustomClusterRenderer(),
      onClusterClick: () => {}, // 기본 fitBounds 동작 비활성화 (fly-to 직접 처리)
    });
  }, [map]);

  // 클러스터 클릭 이벤트 핸들러
  useEffect(() => {
    if (!clusterer) return;

    const clickListener = clusterer.addListener(
      'click',
      (event: ClusterClickEvent) => {
        // 단일 마커는 PinMarker의 onClick에서 처리
        if (!event.markers || event.markers.length <= 1) return null;

        const ids = event.markers
          .map((m) => markerIdMap.current.get(m))
          .filter((id): id is string => !!id);

        if (ids.length > 0) {
          onSelectPost(ids);
        }

        // 클러스터 중심으로 fly-to 애니메이션 (smoothZoom으로 부드럽게 확대)
        const currentMap = mapRef.current;
        if (currentMap && event.position) {
          currentMap.panTo(event.position);
          setTimeout(() => {
            const currentZoom = currentMap.getZoom() ?? 10;
            const count = event.markers?.length ?? 2;
            // 클러스터 개수 기반 최대 줌 (너무 가까이 가지 않도록 제한)
            const maxZoomByCount =
              count <= 4 ? 16 : count <= 10 ? 15 : count <= 30 ? 14 : 13;
            const targetZoom = Math.min(currentZoom + 4, maxZoomByCount);
            smoothZoom(currentMap, targetZoom, () => {
              // 줌 완료 후 지도를 아래로 이동 → 클러스터가 화면 위쪽에 배치
              currentMap.panBy(0, 130);
            });
          }, 550); // panTo 애니메이션 완료까지 대기
        }
      },
    );

    return () => {
      // 리스너 제거
      google.maps.event.removeListener(clickListener);
    };
  }, [clusterer, onSelectPost]);

  // 마커 데이터 변경 시 클러스터러 반영 (diff 방식 - clearMarkers로 전체 초기화 시 기존 마커들이 순간 기본 핀으로 깜빡이는 문제 방지)
  useEffect(() => {
    if (!clusterer) return;

    const newMarkers = Object.values(markers);
    const currentSet = clustererMarkersRef.current;
    const newSet = new Set(newMarkers);

    const toRemove = [...currentSet].filter((m) => !newSet.has(m));
    const toAdd = newMarkers.filter((m) => !currentSet.has(m));

    if (toRemove.length > 0) clusterer.removeMarkers(toRemove, true); // noDraw=true로 배치 처리
    if (toAdd.length > 0) clusterer.addMarkers(toAdd);
    else if (toRemove.length > 0) clusterer.render(); // 제거만 있을 경우 명시적 redraw

    clustererMarkersRef.current = newSet;
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
