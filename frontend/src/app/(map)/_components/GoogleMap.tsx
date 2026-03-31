'use client';

import { useMemo, useEffect } from 'react';
import {
  AdvancedMarker,
  Map,
  Pin,
  useMap,
  useMapsLibrary,
  ColorScheme,
} from '@vis.gl/react-google-maps';
import type { MapPostItem } from '@/lib/types/record';
import { ClusteredPostMarkers } from './ClusteredMarkers';
import { useTheme } from 'next-themes';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/utils/logger';

interface GoogleMapProps {
  posts: MapPostItem[];
  selectedPostId: string | string[] | null;
  onSelectPost: (id: string | string[] | null) => void;
  onBoundsChange?: (bounds: google.maps.LatLngBounds | null) => void;
  onMapClick?: () => void;
  mapRef: React.RefObject<google.maps.Map | null>;
  placesServiceRef: React.RefObject<google.maps.places.PlacesService | null>;
  searchedLocation: { lat: number; lng: number } | null;
}

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

function FlyToOnSelect({
  lat,
  lng,
  offsetX = 0,
  offsetY = 0,
  zoom = 16,
}: {
  lat: number;
  lng: number;
  offsetX?: number;
  offsetY?: number;
  zoom?: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    try {
      // 1단계: 목표 위치로 부드럽게 패닝
      map.panTo({ lat, lng });

      // 2단계: 패닝 애니메이션 완료 후 smoothZoom으로 단계적 확대
      timers.push(
        setTimeout(() => {
          try {
            smoothZoom(map, zoom, () => {
              // 3단계: 줌 완료 후 오프셋 보정 (하단 패널 고려 - 마커를 화면 위쪽에 배치)
              if (offsetX !== 0 || offsetY !== 0) {
                try {
                  map.panBy(-offsetX, offsetY);
                } catch {
                  // 오프셋 보정 실패는 무시
                }
              }
            });
          } catch {
            // 줌 설정 실패는 무시
          }
        }, 400),
      );
    } catch (error) {
      // 지도 이동 실패는 UX에 영향을 주므로 추적
      Sentry.captureException(error, {
        level: 'warning',
        tags: {
          context: 'map',
          operation: 'pan-to-location',
        },
        extra: {
          lat,
          lng,
          offsetX,
          offsetY,
        },
      });
      logger.error('지도 이동 실패', error);
    }

    return () => timers.forEach(clearTimeout);
  }, [map, lat, lng, offsetX, offsetY, zoom]);
  return null;
}

export default function GoogleMap({
  posts,
  selectedPostId,
  onSelectPost,
  onBoundsChange,
  onMapClick,
  mapRef,
  placesServiceRef,
  searchedLocation,
}: GoogleMapProps) {
  const { theme } = useTheme();
  const placesLib = useMapsLibrary('places');

  const selectedPost = useMemo(() => {
    if (typeof selectedPostId === 'string') {
      return posts.find((p) => p.id === selectedPostId) ?? null;
    }
    return null;
  }, [posts, selectedPostId]);

  useEffect(() => {
    if (!placesLib || !mapRef.current || placesServiceRef.current) return;

    try {
      placesServiceRef.current = new placesLib.PlacesService(mapRef.current);
    } catch (error) {
      // Places API 초기화 실패는 검색 기능에 영향
      Sentry.captureException(error, {
        level: 'error',
        tags: {
          context: 'map',
          operation: 'initialize-places-service',
        },
      });
      logger.error('Places Service 초기화 실패', error);
    }
  }, [placesLib, mapRef, placesServiceRef]);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID;

  // 전역 에러에서 잡아 에러 페이지 뜨도록
  if (!apiKey) {
    const error = new Error('Google Maps API 키가 설정되지 않았습니다');
    Sentry.captureException(error, {
      level: 'fatal', // 앱 사용 불가능한 심각한 에러
      tags: {
        context: 'map',
        operation: 'initialize',
        configError: 'missing-api-key',
      },
    });
    throw error;
  }
  if (!mapId) {
    const error = new Error('Google Maps ID가 설정되지 않았습니다');
    Sentry.captureException(error, {
      level: 'fatal',
      tags: {
        context: 'map',
        operation: 'initialize',
        configError: 'missing-map-id',
      },
    });
    logger.error('NEXT_PUBLIC_GOOGLE_MAPS_ID is not defined');

    throw error;
  }

  return (
    <div className="bg-yellow-50 w-full h-full relative">
      <Map
        minZoom={3}
        maxZoom={20}
        colorScheme={theme === 'dark' ? ColorScheme.DARK : ColorScheme.LIGHT}
        mapId={mapId}
        defaultCenter={{ lat: 36.0, lng: 127.9 }}
        defaultZoom={6.7}
        gestureHandling="greedy"
        disableDefaultUI={true}
        onClick={() => onMapClick?.()}
        onDrag={onMapClick}
        onIdle={(e) => onBoundsChange?.(e.map.getBounds() ?? null)}
        restriction={{
          latLngBounds: {
            north: 85,
            south: -85,
            east: 180,
            west: -180,
          },
          strictBounds: true,
        }}
      >
        <ClusteredPostMarkers
          posts={posts}
          onSelectPost={onSelectPost}
          selectedPostId={selectedPostId}
        />

        {selectedPost && (
          <FlyToOnSelect
            lat={Number(selectedPost.lat)}
            lng={Number(selectedPost.lng)}
            offsetY={130}
          />
        )}
        <MapHandler
          setMap={(map) => {
            mapRef.current = map;
          }}
        />
        {searchedLocation && (
          <AdvancedMarker position={searchedLocation} zIndex={1000}>
            <Pin background={'#FB4E4E'} glyphColor={'#FFFFFF'} />
          </AdvancedMarker>
        )}
      </Map>
    </div>
  );
}

function MapHandler({ setMap }: { setMap: (map: google.maps.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    if (map) setMap(map);
  }, [map, setMap]);
  return null;
}
