'use client';

import Input from '@/components/Input';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { Check } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { useSessionStorage } from '@/hooks/useSessionStorage';
import { useRouter } from 'next/navigation';

interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
}

interface PostDraft {
  title: string;
  content: string;
  tags: string[];
  selectedTime: string;
  selectedDate: string;
  selectedLocation: {
    latitude: number;
    longitude: number;
    address: string;
  } | null;
}

export default function SelectLocationPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const router = useRouter();

  // sessionStorage에서 draft 가져오기
  const [draft, setDraft] = useSessionStorage<PostDraft>('diary-travel-draft', {
    title: '',
    content: '',
    tags: [],
    selectedTime: '오전 12:00',
    selectedDate: new Date('2000-01-01').toISOString(),
    selectedLocation: null,
  });

  // 현재 위치 가져오기
  const {
    latitude,
    longitude,
    loading: locationLoading,
  } = useGeolocation({ reverseGeocode: false });

  // 지도 중심 좌표 (지도가 움직일 때마다 업데이트)
  const [center, setCenter] = useState<{ lat: number; lng: number }>({
    lat: latitude || 37.5665,
    lng: longitude || 126.978,
  });

  // 검색 관련 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [nearbyResults, setNearbyResults] = useState<PlaceResult[]>([]);
  const [showNearby, setShowNearby] = useState(false);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(
    null,
  );
  const [isSelecting, setIsSelecting] = useState(false);

  // 현재 위치가 로드되면 지도 중심 업데이트
  useEffect(() => {
    if (latitude && longitude && !locationLoading && center.lat === 37.5665) {
      setCenter({ lat: latitude, lng: longitude });
    }
  }, [latitude, longitude, locationLoading]);

  // Places Service 초기화
  useEffect(() => {
    if (
      typeof google !== 'undefined' &&
      google.maps &&
      !placesServiceRef.current
    ) {
      const map = new google.maps.Map(document.createElement('div'));
      placesServiceRef.current = new google.maps.places.PlacesService(map);
    }
  }, []);

  // 장소 검색 함수
  const handleSearch = () => {
    if (!searchQuery.trim() || !placesServiceRef.current) return;

    const request: google.maps.places.TextSearchRequest = {
      query: searchQuery,
      location: new google.maps.LatLng(center.lat, center.lng),
      // radius: 1000000, // 50km 반경
    };

    placesServiceRef.current.textSearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        const places: PlaceResult[] = results.slice(0, 5).map((place) => ({
          placeId: place.place_id || '',
          name: place.name || '',
          address: place.formatted_address || '',
          location: {
            lat: place.geometry?.location?.lat() || 0,
            lng: place.geometry?.location?.lng() || 0,
          },
        }));
        setSearchResults(places);
        setShowResults(true);
      }
    });
  };

  // 검색 결과 선택 - sessionStorage에 저장하고 이전 페이지로 이동
  const handleSelectPlace = async (place: PlaceResult) => {
    setIsSelecting(true);
    setShowResults(false);

    try {
      // sessionStorage에 저장 - address에 장소명(name) 저장
      setDraft({
        ...draft,
        selectedLocation: {
          latitude: place.location.lat,
          longitude: place.location.lng,
          address: place.name, // 장소명을 주소로 사용
        },
      });

      // 이전 페이지로 돌아가기
      router.back();
    } finally {
      setIsSelecting(false);
    }
  };

  // Enter 키로 검색
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      handleSearch();
    }
  };

  // 주변 장소 검색
  const handleNearbySearch = () => {
    if (!placesServiceRef.current) return;

    const request: google.maps.places.PlaceSearchRequest = {
      location: new google.maps.LatLng(center.lat, center.lng),
      radius: 100, // 10km 반경
    };

    placesServiceRef.current.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        const places: PlaceResult[] = results.slice(0, 10).map((place) => ({
          placeId: place.place_id || '',
          name: place.name || '',
          address: place.vicinity || place.formatted_address || '',
          location: {
            lat: place.geometry?.location?.lat() || 0,
            lng: place.geometry?.location?.lng() || 0,
          },
        }));
        setNearbyResults(places);
        setShowNearby(true);
      }
    });
  };

  // 역지오코딩: 좌표를 주소로 변환
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const geocoder = new google.maps.Geocoder();
      const latlng = { lat, lng };

      geocoder.geocode(
        { location: latlng, language: 'ko' },
        (results, status) => {
          if (status === 'OK' && results && results.length > 0) {
            const addressComponents = results[0].address_components;

            // 시/도, 동 정보 추출
            const city = addressComponents.find(
              (c) =>
                c.types.includes('locality') ||
                c.types.includes('administrative_area_level_1'),
            )?.long_name;

            const neighborhood = addressComponents.find(
              (c) =>
                c.types.includes('sublocality_level_2') ||
                c.types.includes('sublocality_level_3') ||
                c.types.includes('sublocality_level_4'),
            )?.long_name;

            // 주소 조합 (시, 동만 표시, 중복 제거)
            const parts = [city, neighborhood].filter(
              (part, index, array) => part && array.indexOf(part) === index,
            );
            resolve(parts.join(' ') || results[0].formatted_address);
          } else {
            reject(new Error(`Geocoding failed with status: ${status}`));
          }
        },
      );
    });
  };

  // 현재 위치 선택 버튼 클릭 핸들러
  const handleSelectLocation = async () => {
    setIsSelecting(true);

    try {
      // 역지오코딩으로 주소 가져오기
      const address = await reverseGeocode(center.lat, center.lng);

      // sessionStorage에 저장
      setDraft({
        ...draft,
        selectedLocation: {
          latitude: center.lat,
          longitude: center.lng,
          address,
        },
      });

      // 이전 페이지로 돌아가기
      router.back();
    } catch (error) {
      console.error('역지오코딩 실패:', error);
      // 역지오코딩 실패해도 좌표는 저장
      setDraft({
        ...draft,
        selectedLocation: {
          latitude: center.lat,
          longitude: center.lng,
          address: '주소를 가져올 수 없습니다',
        },
      });
      router.back();
    } finally {
      setIsSelecting(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col relative">
      <div className="absolute w-full flex flex-col mt-2 md:px-4 px-2 z-10 md:max-w-96">
        <Popover
          open={showResults && searchResults.length > 0}
          onOpenChange={setShowResults}
        >
          <PopoverTrigger asChild>
            <div className="w-full flex justify-start items-center pointer-events-none">
              <Input className="w-full pointer-events-auto">
                <Input.Field
                  placeholder="장소명으로 검색하기"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <Input.Right>
                  <button onClick={handleSearch}>
                    <Check className="w-5 h-5 text-itta-point cursor-pointer" />
                  </button>
                </Input.Right>
              </Input>
            </div>
          </PopoverTrigger>
          <PopoverContent
            className="w-(--radix-popover-trigger-width) p-0 bg-white"
            align="start"
          >
            {searchResults.length > 0 ? (
              <div className="max-h-60 overflow-y-auto">
                {searchResults.map((place) => (
                  <button
                    key={place.placeId}
                    onClick={() => handleSelectPlace(place)}
                    className="w-full px-4 py-3 text-left hover:bg-itta-gray1/30 cursor-pointer"
                  >
                    <div className="font-medium text-itta-black">
                      {place.name}
                    </div>
                    <div className="text-sm text-itta-gray3 mt-0.5">
                      {place.address}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-3 text-sm text-itta-gray3">
                검색 결과가 없습니다.
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      <div className="relative flex-1">
        <APIProvider apiKey={apiKey!}>
          <Map
            mapId="MAP_ID"
            center={center}
            defaultZoom={17}
            gestureHandling="greedy"
            disableDefaultUI={false}
            zoomControl={true}
            mapTypeControl={false}
            fullscreenControl={true}
            streetViewControl={false}
            controlSize={28}
            onCenterChanged={(e) => {
              if (e.detail.center) {
                setCenter(e.detail.center);
              }
            }}
            style={{ width: '100%', height: '100%' }}
          >
            {/* 현재 사용자 위치 마커 */}
            {latitude && longitude && (
              <AdvancedMarker position={{ lat: latitude, lng: longitude }}>
                <div className="flex justify-center items-center w-7 h-7 bg-itta-point/20 border border-itta-point rounded-full shadow-lg">
                  <div className="w-4.5 h-4.5 border-2 border-white bg-itta-point rounded-full" />
                </div>
              </AdvancedMarker>
            )}
          </Map>
        </APIProvider>

        {/* 지도 중앙 고정 핀 */}
        <div className="z-50 flex flex-col justify-center items-center gap-1.75 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full">
          <div className="w-2 h-2 absolute top-3 left-1/2 -translate-x-1/2 bg-white pointer-events-none" />
          <Image
            src={'/icons/location-on-fill-point.svg'}
            alt="위치 선택 아이콘"
            width={16}
            height={16}
            className="w-10 h-10 relative pointer-events-none"
          />
          <div className="flex gap-2 pointer-events-auto">
            <Button
              onClick={handleSelectLocation}
              disabled={isSelecting}
              variant="default"
            >
              {isSelecting ? '선택 중...' : '현재 위치 선택'}
            </Button>
          </div>
        </div>

        <Drawer open={showNearby} onOpenChange={setShowNearby}>
          <DrawerTrigger asChild>
            <button
              onClick={handleNearbySearch}
              className="bottom-23 absolute md:bottom-5 left-5 px-4 py-2 border border-itta-gray2 rounded-md bg-white font-medium cursor-pointer"
            >
              주변 장소 목록 보기
            </button>
          </DrawerTrigger>
          <DrawerContent className="max-w-5xl mx-auto">
            <DrawerHeader>
              <DrawerTitle>주변 장소 목록</DrawerTitle>
              <DrawerDescription>
                현재 위치 주변의 장소를 선택하세요.
              </DrawerDescription>
            </DrawerHeader>

            <div className="px-4 pb-8 max-h-96 overflow-y-auto">
              {nearbyResults.length > 0 ? (
                <div className="space-y-2">
                  {nearbyResults.map((place) => (
                    <DrawerClose key={place.placeId} asChild>
                      <button
                        onClick={() => handleSelectPlace(place)}
                        className="w-full px-4 py-3 text-left hover:bg-itta-gray1/30 cursor-pointer"
                      >
                        <div className="font-medium text-itta-black">
                          {place.name}
                        </div>
                        <div className="text-sm text-itta-gray3 mt-0.5">
                          {place.address}
                        </div>
                      </button>
                    </DrawerClose>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-itta-gray3">
                  주변 장소를 찾을 수 없습니다.
                </div>
              )}
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}
