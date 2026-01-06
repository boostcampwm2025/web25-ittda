'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Search } from 'lucide-react';
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

  // 구글 맵 인스턴스 및 서비스 Ref
  const mapRef = useRef<google.maps.Map | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(
    null,
  );

  const { latitude: geoLat, longitude: geoLng } = useGeolocation({
    reverseGeocode: false,
  });

  // 라이브러리 로드 훅
  const placesLib = useMapsLibrary('places');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    google.maps.places.PlaceResult[]
  >([]);
  const [showResults, setShowResults] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Places Service 초기화
   * 라이브러리와 지도 인스턴스 준비되면 한 번만 생성
   */
  useEffect(() => {
    if (!mapRef.current || !placesLib) return;
    if (!placesServiceRef.current) {
      placesServiceRef.current = new placesLib.PlacesService(mapRef.current);
    }
  }, [placesLib, mapRef.current]);

  /**
   * 내 위치로 지도 이동
   */
  useEffect(() => {
    if (geoLat && geoLng && mapRef.current) {
      mapRef.current.panTo({ lat: geoLat, lng: geoLng });
    }
  }, [geoLat, geoLng]);

  /**
   * 장소 검색
   */
  const handleSearch = () => {
    if (!searchQuery.trim() || !mapRef.current) return;

    if (!placesServiceRef.current) {
      placesServiceRef.current = new google.maps.places.PlacesService(
        mapRef.current,
      );
    }

    const currentCenter = mapRef.current.getCenter();
    const request: google.maps.places.TextSearchRequest = {
      query: searchQuery,
      location: currentCenter,
    };

    placesServiceRef.current.textSearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        setSearchResults(results.slice(0, 5));
        setShowResults(true);
      }
    });
  };

  // 역지오코딩 (좌표 -> 주소)
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode(
        { location: { lat, lng }, language: 'ko' },
        (results, status) => {
          if (status === 'OK' && results?.[0]) {
            const addressComponents = results[0].address_components;
            const city = addressComponents.find(
              (c) =>
                c.types.includes('locality') ||
                c.types.includes('administrative_area_level_1'),
            )?.long_name;
            const neighborhood = addressComponents.find(
              (c) =>
                c.types.includes('sublocality_level_2') ||
                c.types.includes('sublocality_level_4'),
            )?.long_name;
            const parts = [city, neighborhood].filter(
              (part, index, array) => part && array.indexOf(part) === index,
            );
            resolve(parts.join(' ') || results[0].formatted_address);
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        },
      );
    });
  };

  /**
   * 위치 확정 처리
   * 검색 결과에서 선택한 경우 전달되는 객체
   */
  const handleConfirm = async (place?: google.maps.places.PlaceResult) => {
    if (!mapRef.current) return;
    setIsProcessing(true);

    try {
      const center = mapRef.current.getCenter()!;

      // 위도/경도 추출
      let lat = center.lat();
      let lng = center.lng();
      let addr = '';

      if (place && place.geometry?.location) {
        lat = place.geometry.location.lat();
        lng = place.geometry.location.lng();
        addr = place.name || place.formatted_address || '';
      } else {
        addr = await reverseGeocode(lat, lng);
      }

      // 기본 데이터 생성
      const data: LocationValue = {
        lat,
        lng,
        address: addr,
      };

      // search모드일 때만 지도의 현재 바운더리(영역) 정보 포함
      if (mode === 'search') {
        const bounds = mapRef.current.getBounds();
        if (bounds) {
          data.bounds = {
            north: bounds.getNorthEast().lat(),
            south: bounds.getSouthWest().lat(),
            east: bounds.getNorthEast().lng(),
            west: bounds.getSouthWest().lng(),
          };
        }
      }

      // 부모 컴포넌트로 데이터 전달
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
      {/* 검색 바 섹션 */}
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
            onOpenAutoFocus={(e) => e.preventDefault()}
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

      {/* 지도 섹션 */}
      <div className="flex-1 relative z-10">
        <APIProvider apiKey={apiKey}>
          <Map
            defaultCenter={initialCenter || { lat: 37.5665, lng: 126.978 }}
            defaultZoom={15}
            disableDefaultUI
            gestureHandling="greedy"
            onDragstart={() => setShowResults(false)}
          >
            <MapHandler
              setMap={(map) => {
                mapRef.current = map;
              }}
            />
          </Map>
        </APIProvider>

        {/* 중앙 선택 핀 및 버튼 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[calc(100%+4px)] pointer-events-none z-20 flex flex-col items-center">
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
              disabled={isProcessing}
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

      {/* 하단 가이드 문구 */}
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

/**
 * 지도 인스턴스 획득을 위한 내부 컴포넌트
 */
function MapHandler({ setMap }: { setMap: (map: google.maps.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    if (map) setMap(map);
  }, [map, setMap]);
  return null;
}
