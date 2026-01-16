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
}: {
  lat: number;
  lng: number;
  offsetX?: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    map.panTo({ lat, lng });
    // 필요하면 줌도 고정
    // map.setZoom(13);

    if (offsetX !== 0) {
      map.panBy(-offsetX, 0);
    }
  }, [map, lat, lng, offsetX]);
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

    placesServiceRef.current = new placesLib.PlacesService(mapRef.current);
  }, [placesLib, mapRef, placesServiceRef]);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // 전역 에러에서 잡아 에러 페이지 뜨도록
  if (!apiKey) throw new Error('지도 호출 에러');

  return (
    <div className="bg-yellow-50 w-full h-full relative">
      <Map
        colorScheme={theme === 'dark' ? ColorScheme.DARK : ColorScheme.LIGHT}
        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID}
        defaultCenter={{ lat: 37.5665, lng: 126.978 }}
        defaultZoom={12}
        gestureHandling="greedy"
        disableDefaultUI={true}
        onClick={() => onMapClick?.()}
        onIdle={(e) => onBoundsChange?.(e.map.getBounds() ?? null)}
      >
        <ClusteredPostMarkers posts={posts} onSelectPost={onSelectPost} />

        {selectedPost && (
          <FlyToOnSelect
            lat={Number(selectedPost.lat)}
            lng={Number(selectedPost.lng)}
            offsetX={250}
          />
        )}
        <MapHandler
          setMap={(map) => {
            mapRef.current = map;
          }}
        />
        {searchedLocation && (
          <AdvancedMarker position={searchedLocation}>
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
