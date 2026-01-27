'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import {
  APIProvider,
  Map,
  useMap,
  useMapsLibrary,
  ColorScheme,
} from '@vis.gl/react-google-maps';
import { Button } from '@/components/ui/button';
import { useGeolocation } from '@/hooks/useGeolocation';
import { LocationValue } from '@/lib/types/recordField';
import { useTheme } from 'next-themes';
import { MapSearchBar } from './MapSearchBar';
import { searchPlacesByKeyword } from '@/lib/utils/googleMaps';
import { cn } from '@/lib/utils';

export type LocationMode = 'search' | 'post';

export interface LocationPickerProps {
  mode: LocationMode;
  onSelect: (data: LocationValue) => void;
  initialCenter?: { lat: number; lng: number };
  className?: string;
}

export function LocationPicker({
  mode,
  onSelect,
  initialCenter,
  className,
}: LocationPickerProps) {
  const { theme } = useTheme();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string;

  const mapRef = useRef<google.maps.Map | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(
    null,
  );
  const isSelectedFromSearch = useRef(false);

  const { latitude: geoLat, longitude: geoLng } = useGeolocation({
    reverseGeocode: false,
  });

  const placesLib = useMapsLibrary('places');
  const geometryLib = useMapsLibrary('geometry');
  const [searchResults, setSearchResults] = useState<
    google.maps.places.PlaceResult[]
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const [centerAddress, setCenterAddress] = useState<string>('');
  const [centerPlaceName, setCenterPlaceName] = useState<string>('');
  const [isAddressLoading, setIsAddressLoading] = useState(false);

  useEffect(() => {
    if (!mapRef.current || !placesLib) return;
    if (!placesServiceRef.current) {
      placesServiceRef.current = new placesLib.PlacesService(mapRef.current);
    }
  }, [placesLib]);

  useEffect(() => {
    if (geoLat && geoLng && mapRef.current) {
      mapRef.current.panTo({ lat: geoLat, lng: geoLng });
    }
  }, [geoLat, geoLng]);

  const handleSearch = async (keyword: string) => {
    if (!keyword.trim() || !mapRef.current) return;
    if (!placesServiceRef.current) {
      placesServiceRef.current = new google.maps.places.PlacesService(
        mapRef.current,
      );
    }
    const currentPlacesServiceRef = placesServiceRef.current;
    const currentCenter = mapRef.current.getCenter();
    setIsProcessing(true);

    const results = await searchPlacesByKeyword(
      currentPlacesServiceRef,
      keyword,
      currentCenter,
    );
    setSearchResults(results.slice(0, 10));
    setIsProcessing(false);
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode(
        { location: { lat, lng }, language: 'ko' },
        (results, status) => {
          if (status === 'OK' && results?.[0]) {
            resolve(results[0].formatted_address);
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        },
      );
    });
  };

  /**
   * 지도가 멈췄을 때(Idle) 중심 좌표의 주소를 갱신
   */
  const handleMapIdle = async () => {
    if (!mapRef.current) return;
    if (isSelectedFromSearch.current) {
      isSelectedFromSearch.current = false;
      return;
    }

    const center = mapRef.current.getCenter();
    if (!center) return;

    setIsAddressLoading(true);
    try {
      const addr = await reverseGeocode(center.lat(), center.lng());
      setCenterAddress(addr);
      setCenterPlaceName('');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setCenterAddress('주소를 불러올 수 없습니다.');
    } finally {
      setIsAddressLoading(false);
    }
  };

  const handleSelectPlace = (place: google.maps.places.PlaceResult) => {
    if (!mapRef.current || !place.geometry?.location) return;

    const location = place.geometry.location;

    isSelectedFromSearch.current = true;

    setCenterPlaceName(place.name || '');
    setCenterAddress(place.formatted_address || '');

    // 지도를 해당 위치로 이동
    mapRef.current.panTo({
      lat: location.lat(),
      lng: location.lng(),
    });

    mapRef.current.setZoom(17);
  };

  const handleConfirm = async () => {
    if (!mapRef.current) return;
    setIsProcessing(true);

    try {
      const center = mapRef.current.getCenter()!;
      const data: LocationValue = {
        lat: center.lat(),
        lng: center.lng(),
        address: centerAddress,
        placeName: centerPlaceName || undefined,
      };

      if (mode === 'search') {
        const bounds = mapRef.current.getBounds();
        if (bounds && geometryLib) {
          const ne = bounds.getNorthEast();
          const radiusInMeters =
            google.maps.geometry.spherical.computeDistanceBetween(center, ne);
          data.radius = Math.round(radiusInMeters);
        }
      }

      onSelect(data);
    } catch (error) {
      console.error('Location Confirm Error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className={cn(
        'w-full h-[500px] flex flex-col relative overflow-hidden bg-white',
        className,
      )}
    >
      {/* 검색 바 */}
      <div className="absolute top-4 w-full px-4 z-50 max-w-md left-1/2 -translate-x-1/2">
        <MapSearchBar
          onSelect={handleSelectPlace}
          placeholder={mode === 'search' ? '검색할 지역 입력' : '장소 검색'}
          searchResults={searchResults}
          onSearch={handleSearch}
          isSearching={isProcessing}
        />
      </div>

      {/* 지도 */}
      <div className="flex-1 relative z-10">
        <APIProvider apiKey={apiKey}>
          <Map
            colorScheme={
              theme === 'dark' ? ColorScheme.DARK : ColorScheme.LIGHT
            }
            mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID}
            defaultCenter={initialCenter || { lat: 37.5665, lng: 126.978 }}
            defaultZoom={15}
            disableDefaultUI
            gestureHandling="greedy"
            onDragstart={() => {
              setIsAddressLoading(true); // 드래그 시작 시 로딩 상태로 변경
            }}
            onIdle={handleMapIdle} // 지도가 멈추면 주소 갱신
          >
            <MapHandler
              setMap={(map) => {
                mapRef.current = map;
              }}
            />
          </Map>
        </APIProvider>

        {/* 중앙 핀 및 주소 표시 라벨 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[calc(100%+4px)] pointer-events-none z-20 flex flex-col items-center">
          {/* 주소 표시 버블 */}
          <div className="mb-2 bg-white/90 dark:bg-gray-800/90 px-2 py-1.5 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 flex items-center gap-2 max-w-[300px]">
            {isAddressLoading ? (
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
            ) : (
              <span className="text-[12px] font-semibold text-gray-700 dark:text-gray-200 truncate">
                {centerPlaceName || centerAddress || '위치 확인 중...'}
              </span>
            )}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white/90 dark:bg-gray-800/90 rotate-45 border-b border-r border-gray-100 dark:border-gray-700" />
          </div>

          <Image
            src="/icons/location-on-fill-point.svg"
            alt="location pin"
            width={40}
            height={40}
          />

          <div className="mt-4 pointer-events-auto">
            <Button
              size="sm"
              onClick={() => handleConfirm()}
              disabled={isProcessing || isAddressLoading}
              className="shadow-lg font-bold px-6 h-10 rounded-full"
            >
              {isProcessing
                ? '처리 중...'
                : mode === 'search'
                  ? '이 영역 내 검색'
                  : '이 위치에 기록'}
            </Button>
          </div>
        </div>
      </div>

      {/* 하단 가이드 */}
      <div className="bg-gray-50 dark:bg-gray-900 py-2 px-4 text-center border-t">
        <p className="text-[11px] text-gray-400 font-medium">
          {mode === 'search'
            ? '지도를 드래그하여 검색 바운더리를 설정하세요.'
            : '기록할 장소의 중앙에 핀을 맞춰주세요.'}
        </p>
      </div>
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
