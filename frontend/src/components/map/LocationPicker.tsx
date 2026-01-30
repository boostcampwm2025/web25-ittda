'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Loader2, Locate } from 'lucide-react';
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
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string;

  return (
    <APIProvider apiKey={apiKey}>
      <LocationPickerContent
        mode={mode}
        onSelect={onSelect}
        initialCenter={initialCenter}
        className={className}
      />
    </APIProvider>
  );
}

function LocationPickerContent({
  mode,
  onSelect,
  initialCenter,
  className,
}: LocationPickerProps) {
  const { theme } = useTheme();

  const mapRef = useRef<google.maps.Map | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(
    null,
  );
  const isSelectedFromSearch = useRef(false);

  const { latitude: geoLat, longitude: geoLng } = useGeolocation({
    reverseGeocode: true,
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
  }, [placesLib, mapRef.current]);

  useEffect(() => {
    if (geoLat && geoLng && mapRef.current) {
      // 지도 이동
      mapRef.current.panTo({ lat: geoLat, lng: geoLng });

      // 이동한 위치의 주소 강제 갱신
      const updateInitialAddress = async () => {
        setIsAddressLoading(true);
        try {
          const placeName = await findNearbyPlace(geoLat, geoLng);
          const addr = await reverseGeocode(geoLat, geoLng);

          setCenterAddress(addr);
          setCenterPlaceName(placeName || '');
        } catch (error) {
          console.error('Initial Geocode Error:', error);
        } finally {
          setIsAddressLoading(false);
        }
      };

      updateInitialAddress();
    }
  }, [geoLat, geoLng]);

  const handleSearch = async (keyword: string) => {
    if (!keyword.trim() || !mapRef.current || !placesLib) return;
    if (!placesServiceRef.current) {
      placesServiceRef.current = new placesLib.PlacesService(mapRef.current);
    }
    const currentPlacesServiceRef = placesServiceRef.current;
    const currentCenter = mapRef.current.getCenter();

    // getCenter()가 undefined를 반환할 수 있으므로 fallback 처리
    const searchCenter = currentCenter
      ? currentCenter
      : geoLat && geoLng
        ? new google.maps.LatLng(geoLat, geoLng)
        : undefined;

    setIsProcessing(true);

    const results = await searchPlacesByKeyword(
      currentPlacesServiceRef,
      keyword,
      searchCenter,
    );
    setSearchResults(results.slice(0, 10));
    setIsProcessing(false);
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!window.google?.maps?.Geocoder) {
        reject(new Error('Google Maps API not loaded'));
        return;
      }
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode(
        { location: { lat, lng }, language: 'ko' },
        (results, status) => {
          if (status === 'OK' && results?.[0]) {
            // address_components에서 동/구 수준까지만 조합
            const components = results[0].address_components;
            const country =
              components.find((c) => c.types.includes('country'))?.long_name ||
              '';
            const level1 =
              components.find((c) =>
                c.types.includes('administrative_area_level_1'),
              )?.long_name || '';
            const sublocalityLevel1 =
              components.find((c) => c.types.includes('sublocality_level_1'))
                ?.long_name || '';
            const sublocalityLevel2 =
              components.find((c) => c.types.includes('sublocality_level_2'))
                ?.long_name || '';

            const address = [
              country,
              level1,
              sublocalityLevel1,
              sublocalityLevel2,
            ]
              .filter(Boolean)
              .join(' ');

            resolve(address || results[0].formatted_address);
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        },
      );
    });
  };

  /**
   * 중심 위치 근처의 POI(장소) 찾기
   */
  const findNearbyPlace = async (
    lat: number,
    lng: number,
  ): Promise<string | null> => {
    // placesServiceRef가 null이면 생성
    if (!placesServiceRef.current) {
      if (!mapRef.current || !placesLib) {
        return null;
      }
      placesServiceRef.current = new placesLib.PlacesService(mapRef.current);
    }

    return new Promise((resolve) => {
      const center = new google.maps.LatLng(lat, lng);
      const request: google.maps.places.PlaceSearchRequest = {
        location: center,
        radius: 50,
        type: 'point_of_interest',
      };

      try {
        placesServiceRef.current!.nearbySearch(request, (results, status) => {
          // status가 OK가 아니거나 결과가 빈 배열일 경우 모두 resolve(null)
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            results &&
            results.length > 0
          ) {
            const nearestPlace = results[0];
            const placeLoc = nearestPlace.geometry?.location;

            if (placeLoc && geometryLib) {
              const distance =
                google.maps.geometry.spherical.computeDistanceBetween(
                  center,
                  placeLoc,
                );
              if (distance <= 15) {
                return resolve(nearestPlace.name || null);
              }
            }
          }

          // 어떤 조건에도 해당하지 않으면 null 반환 (여기서 무한 로딩 방지)
          resolve(null);
        });
      } catch (error) {
        console.error('NearbySearch Error:', error);
        resolve(null);
      }
    });
  };

  const getPlacesService = () => {
    if (placesServiceRef.current) return placesServiceRef.current;

    if (mapRef.current && placesLib) {
      placesServiceRef.current = new placesLib.PlacesService(mapRef.current);
      return placesServiceRef.current;
    }
    return null;
  };

  /**
   * 지도가 멈췄을 때(Idle) 중심 좌표의 주소를 갱신
   */
  const handleMapIdle = async () => {
    const service = getPlacesService();
    if (!service || !mapRef.current) return;
    if (isSelectedFromSearch.current) {
      isSelectedFromSearch.current = false;
      return;
    }

    const center = mapRef.current.getCenter();
    if (!center) return;

    setIsAddressLoading(true);
    try {
      // 먼저 근처 POI 찾기
      const placeName = await findNearbyPlace(center.lat(), center.lng());

      if (placeName) {
        setCenterPlaceName(placeName);
        // 주소도 함께 가져오기
        const addr = await reverseGeocode(center.lat(), center.lng());
        setCenterAddress(addr);
      } else {
        // POI가 없으면 주소만 표시
        const addr = await reverseGeocode(center.lat(), center.lng());
        setCenterAddress(addr);
        setCenterPlaceName('');
      }
    } catch (error) {
      console.error('Error in handleMapIdle:', error);
      setCenterAddress('주소를 불러올 수 없습니다.');
      setCenterPlaceName('');
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
        if (bounds && geometryLib && window.google?.maps?.geometry?.spherical) {
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

  const handleMyLocation = () => {
    if (!mapRef.current || !geoLat || !geoLng) return;
    mapRef.current.panTo({ lat: geoLat, lng: geoLng });
    mapRef.current.setZoom(17);
  };

  return (
    <div
      className={cn(
        'w-full h-125 md:h-150 flex flex-col relative overflow-hidden bg-white',
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
        <Map
          colorScheme={theme === 'dark' ? ColorScheme.DARK : ColorScheme.LIGHT}
          mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID}
          defaultCenter={initialCenter || { lat: 37.5665, lng: 126.978 }}
          defaultZoom={17}
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

        {/* 내 위치로 가기 버튼 */}
        <button
          onClick={handleMyLocation}
          disabled={!geoLat || !geoLng}
          className="absolute bottom-6 right-4 z-30 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="내 위치로 이동"
        >
          <Locate size={20} className="text-gray-700 dark:text-gray-200" />
        </button>

        {/* 중앙 핀 및 주소 표시 라벨 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[calc(100%-43px)] pointer-events-none z-20 flex flex-col items-center">
          {/* 주소 표시 버블 */}
          <div className="mb-2 bg-white/90 dark:bg-gray-800/90 px-2 py-1.5 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 flex items-center gap-2 max-w-75">
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
            // className="-translate-y-[85%]"
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
