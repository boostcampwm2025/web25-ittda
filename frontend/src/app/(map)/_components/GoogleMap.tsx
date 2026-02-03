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
import { useGeolocation } from '@/hooks/useGeolocation';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/utils/logger';

interface GoogleMapProps {
  posts: MapPostItem[];
  selectedPostId: string | string[] | null;
  onSelectPost: (id: string | string[] | null) => void;
  onBoundsChange?: (bounds: google.maps.LatLngBounds | null) => void;
  onMapClick?: () => void;
  mapRef: React.MutableRefObject<google.maps.Map | null>;
  placesServiceRef: React.MutableRefObject<google.maps.places.PlacesService | null>;
  searchedLocation: { lat: number; lng: number } | null;
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
    try {
      map.panTo({ lat, lng });
      map.setZoom(zoom);

      if (offsetX !== 0 || offsetY !== 0) {
        map.panBy(-offsetX, offsetY);
      }
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

  const { latitude: geoLat, longitude: geoLng } = useGeolocation({
    reverseGeocode: true,
  });

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

  // 초기 유저의 위치로 지도 이동
  useEffect(() => {
    if (geoLat && geoLng && mapRef.current) {
      try {
        mapRef.current.panTo({ lat: geoLat, lng: geoLng });
      } catch (error) {
        // 사용자 위치로 이동 실패
        Sentry.captureException(error, {
          level: 'warning',
          tags: {
            context: 'map',
            operation: 'pan-to-user-location',
          },
          extra: {
            lat: geoLat,
            lng: geoLng,
          },
        });
        logger.error('사용자 위치로 지도 이동 실패', error);
      }
    }
  }, [geoLat, geoLng, mapRef]);

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
        defaultCenter={{ lat: 37.5665, lng: 126.978 }}
        defaultZoom={16}
        gestureHandling="greedy"
        disableDefaultUI={true}
        onClick={() => onMapClick?.()}
        onDrag={onMapClick}
        onIdle={(e) => onBoundsChange?.(e.map.getBounds() ?? null)}
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
