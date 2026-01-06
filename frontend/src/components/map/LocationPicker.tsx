'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Search, Loader2 } from 'lucide-react'; // 로딩 아이콘 추가
import {
  APIProvider,
  Map,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useGeolocation } from '@/hooks/useGeolocation';
import Input from '../Input';
import { LocationValue } from '@/lib/types/recordField';

export type LocationMode = 'search' | 'post';

export interface LocationPickerProps {
  mode: LocationMode;
  onSelect: (data: LocationValue) => void;
  initialCenter?: { lat: number; lng: number };
}

export function LocationPicker({
  mode,
  onSelect,
  initialCenter,
}: LocationPickerProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string;

  const mapRef = useRef<google.maps.Map | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(
    null,
  );

  const { latitude: geoLat, longitude: geoLng } = useGeolocation({
    reverseGeocode: false,
  });

  const placesLib = useMapsLibrary('places');
  const geometryLib = useMapsLibrary('geometry');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    google.maps.places.PlaceResult[]
  >([]);
  const [showResults, setShowResults] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- 추가된 상태 ---
  const [centerAddress, setCenterAddress] = useState<string>(''); // 현재 중심 주소
  const [isAddressLoading, setIsAddressLoading] = useState(false); // 주소 로딩 상태

  useEffect(() => {
    if (!mapRef.current || !placesLib) return;
    if (!placesServiceRef.current) {
      placesServiceRef.current = new placesLib.PlacesService(mapRef.current);
    }
  }, [placesLib, mapRef.current]);

  useEffect(() => {
    if (geoLat && geoLng && mapRef.current) {
      mapRef.current.panTo({ lat: geoLat, lng: geoLng });
    }
  }, [geoLat, geoLng]);

  const handleSearch = () => {
    if (!searchQuery.trim() || !mapRef.current) return;
    const currentCenter = mapRef.current.getCenter();
    const request: google.maps.places.TextSearchRequest = {
      query: searchQuery,
      location: currentCenter,
    };

    placesServiceRef.current?.textSearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        setSearchResults(results.slice(0, 5));
        setShowResults(true);
      }
    });
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
    const center = mapRef.current.getCenter();
    if (!center) return;

    setIsAddressLoading(true);
    try {
      const addr = await reverseGeocode(center.lat(), center.lng());
      setCenterAddress(addr);
    } catch (error) {
      setCenterAddress('주소를 불러올 수 없습니다.');
    } finally {
      setIsAddressLoading(false);
    }
  };

  const handleConfirm = async (place?: google.maps.places.PlaceResult) => {
    if (!mapRef.current) return;
    setIsProcessing(true);

    try {
      const center = mapRef.current.getCenter()!;
      let lat = center.lat();
      let lng = center.lng();
      let addr = centerAddress; // 이미 구해놓은 중심 주소 사용

      if (place && place.geometry?.location) {
        lat = place.geometry.location.lat();
        lng = place.geometry.location.lng();
        addr = place.name || place.formatted_address || '';
      }

      const data: LocationValue = { lat, lng, address: addr };

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
      setShowResults(false);
    }
  };

  return (
    <div className="w-full h-[500px] md:h-[600px] flex flex-col relative overflow-hidden bg-white">
      {/* 검색 바 */}
      <div className="absolute top-4 w-full px-4 z-50 max-w-md left-1/2 -translate-x-1/2">
        <Popover
          open={showResults && searchResults.length > 0}
          onOpenChange={setShowResults}
        >
          <PopoverTrigger asChild>
            <div className="w-full">
              <Input className="shadow-xl border-none bg-white">
                <Input.Field
                  placeholder={
                    mode === 'search' ? '검색할 지역 입력' : '장소 검색'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Input.Right>
                  <button onClick={handleSearch} type="button">
                    <Search className="w-4 h-4 text-gray-400" />
                  </button>
                </Input.Right>
              </Input>
            </div>
          </PopoverTrigger>
          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] p-0 bg-white shadow-2xl border"
            align="start"
          >
            <div className="max-h-60 overflow-y-auto">
              {searchResults.map((p) => (
                <button
                  key={p.place_id}
                  type="button"
                  onClick={() => handleConfirm(p)}
                  className="w-full p-3 text-left hover:bg-gray-100 border-b last:border-0 flex flex-col"
                >
                  <span className="font-bold text-sm text-gray-900">
                    {p.name}
                  </span>
                  <span className="text-xs text-gray-500 truncate">
                    {p.formatted_address}
                  </span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* 지도 */}
      <div className="flex-1 relative z-10">
        <APIProvider apiKey={apiKey}>
          <Map
            defaultCenter={initialCenter || { lat: 37.5665, lng: 126.978 }}
            defaultZoom={15}
            disableDefaultUI
            gestureHandling="greedy"
            onDragstart={() => {
              setShowResults(false);
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
                {centerAddress || '위치 확인 중...'}
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
