'use client';

import Input from '@/components/Input';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
} from '@vis.gl/react-google-maps';
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

  // 지도의 인스턴스를 직접 제어하기 위한 ref
  const mapRef = useRef<google.maps.Map | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(
    null,
  );

  const [draft, setDraft] = useSessionStorage<PostDraft>('diary-travel-draft', {
    title: '',
    content: '',
    tags: [],
    selectedTime: '오전 12:00',
    selectedDate: new Date('2000-01-01').toISOString(),
    selectedLocation: null,
  });

  const {
    latitude,
    longitude,
    loading: locationLoading,
  } = useGeolocation({ reverseGeocode: false });

  // 초기 중심값 (상태가 아닌 일반 변수로 관리하거나, 한 번만 설정)
  const [initialCenter] = useState({ lat: 37.5665, lng: 126.978 });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [nearbyResults, setNearbyResults] = useState<PlaceResult[]>([]);
  const [showNearby, setShowNearby] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);

  // 현재 위치로 지도 이동 (최초 1회 혹은 버튼 클릭 시)
  useEffect(() => {
    if (latitude && longitude && mapRef.current) {
      mapRef.current.panTo({ lat: latitude, lng: longitude });
    }
  }, [latitude, longitude]);

  // 장소 검색 함수
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

  const handleSelectPlace = async (place: PlaceResult) => {
    setIsSelecting(true);
    setShowResults(false);
    try {
      setDraft({
        ...draft,
        selectedLocation: {
          latitude: place.location.lat,
          longitude: place.location.lng,
          address: place.name,
        },
      });
      router.back();
    } finally {
      setIsSelecting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      handleSearch();
    }
  };

  const handleNearbySearch = () => {
    if (!mapRef.current) return;

    if (!placesServiceRef.current) {
      placesServiceRef.current = new google.maps.places.PlacesService(
        mapRef.current,
      );
    }

    const currentCenter = mapRef.current.getCenter();
    const request: google.maps.places.PlaceSearchRequest = {
      location: currentCenter,
      radius: 200,
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

  const handleSelectLocation = async () => {
    if (!mapRef.current) return;
    const center = mapRef.current.getCenter();
    if (!center) return;

    const lat = center.lat();
    const lng = center.lng();

    setIsSelecting(true);
    try {
      const address = await reverseGeocode(lat, lng);
      setDraft({
        ...draft,
        selectedLocation: { latitude: lat, longitude: lng, address },
      });
      router.back();
    } catch (error) {
      console.error(error);
      setDraft({
        ...draft,
        selectedLocation: {
          latitude: lat,
          longitude: lng,
          address: '주소 미확인 위치',
        },
      });
      router.back();
    } finally {
      setIsSelecting(false);
    }
  };

  function MapHandler({ setMap }: { setMap: (map: google.maps.Map) => void }) {
    const map = useMap(); // 현재 컨텍스트의 지도 인스턴스를 가져옵니다.

    useEffect(() => {
      if (map) {
        setMap(map);
      }
    }, [map, setMap]);

    return null;
  }

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
          </PopoverContent>
        </Popover>
      </div>

      <div className="relative flex-1">
        <APIProvider apiKey={apiKey!}>
          <Map
            mapId="MAP_ID"
            defaultCenter={initialCenter}
            defaultZoom={17}
            gestureHandling="greedy"
            disableDefaultUI={false}
            style={{ width: '100%', height: '100%' }}
          >
            <MapHandler
              setMap={(map) => {
                mapRef.current = map;
              }}
            />
            {latitude && longitude && (
              <AdvancedMarker position={{ lat: latitude, lng: longitude }}>
                <div className="flex justify-center items-center w-7 h-7 bg-itta-point/20 border border-itta-point rounded-full shadow-lg">
                  <div className="w-4.5 h-4.5 border-2 border-white bg-itta-point rounded-full" />
                </div>
              </AdvancedMarker>
            )}
          </Map>
        </APIProvider>

        <div className="z-50 flex flex-col justify-center items-center gap-1.75 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full pointer-events-none">
          <div className="w-2 h-2 absolute top-3 left-1/2 -translate-x-1/2 bg-white" />
          <Image
            src={'/icons/location-on-fill-point.svg'}
            alt="위치 선택 아이콘"
            width={40}
            height={40}
            className="w-10 h-10 relative"
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
              className="bottom-23 absolute md:bottom-5 left-5 px-4 py-2 border border-itta-gray2 rounded-md bg-white font-medium cursor-pointer z-10"
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
              {nearbyResults.map((place) => (
                <DrawerClose key={place.placeId} asChild>
                  <button
                    onClick={() => handleSelectPlace(place)}
                    className="w-full px-4 py-3 text-left hover:bg-itta-gray1/30 cursor-pointer border-b border-itta-gray1 last:border-0"
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
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}
