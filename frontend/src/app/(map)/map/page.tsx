'use client';

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';

import GoogleMap from '../_components/GoogleMap';

import RecordMapDrawer from '../_components/RecordMapDrawer';

import { MapPostItem } from '@/lib/types/record';
import { FilterChip } from '@/components/search/FilterChip';
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps';
import { MapSearchBar } from '@/components/map/MapSearchBar';
import { searchPlacesByKeyword } from '@/lib/utils/googleMaps';
import {
  makeDateLabel,
  makeEmotionLabel,
  makeTagLabel,
} from '@/lib/utils/filterLabels';
import { useSearchFilters } from '@/hooks/useSearchFilters';
import { FilterDrawerRenderer } from '@/components/search/FilterDrawerRender';
import LocationPermissionChecker from '@/components/LocationPermissionChecker';
import { useQuery } from '@tanstack/react-query';
import { mapRecordListOptions } from '@/lib/api/records';
import { useGeolocation } from '@/hooks/useGeolocation';

export const DUMMY_POSTS: MapPostItem[] = [
  {
    id: 'post-1',

    lat: 37.5445,

    lng: 127.0561,

    title: '성수동의 오후, 햇살 가득한 카페',

    thumbnailUrl:
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1000',

    createdAt: '2026-01-10T14:30:00Z',

    tags: ['성수동', '카페투어', '주말'],

    placeName: '성수동 카페거리',
  },

  {
    id: 'post-2',

    lat: 37.5312,

    lng: 127.0011,

    title: '한남동 전시회 나들이',

    thumbnailUrl:
      'https://images.unsplash.com/photo-1518998053574-53ee7536d9aa?q=80&w=1000',

    createdAt: '2026-01-12T11:00:00Z',

    tags: ['전시', '미술관', '문화생활'],

    placeName: '한남동 리움미술관',
  },

  {
    id: 'post-3',

    lat: 37.5443,

    lng: 127.0374,

    title: '서울숲 가을 산책',

    thumbnailUrl:
      'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=1000',

    createdAt: '2026-01-13T10:15:00Z',

    tags: ['서울숲', '산책', '힐링'],

    placeName: '서울숲 공원',
  },

  {
    id: 'post-4',

    lat: 37.4979,

    lng: 127.0276,

    title: '강남역 연말 모임 장소 추천',

    thumbnailUrl:
      'https://images.unsplash.com/photo-1516715094483-75da7dee9758?q=80&w=1000',

    createdAt: '2025-12-28T19:00:00Z',

    tags: ['강남역', '맛집', '연말모임'],

    placeName: '강남역 11번 출구 인근',
  },

  {
    id: 'post-5',

    lat: 37.5565,

    lng: 126.9239,

    title: '홍대 버스킹과 밤거리 풍경',

    thumbnailUrl:
      'https://images.unsplash.com/photo-1578912853046-01f769558177?q=80&w=1000',

    createdAt: '2026-01-05T21:00:00Z',

    tags: ['홍대', '밤산책', '음악'],

    placeName: '홍대 걷고싶은거리',
  },

  {
    id: 'post-6',

    lat: 37.5826,

    lng: 126.9831,

    title: '북촌 한옥마을 고즈넉한 풍경',

    thumbnailUrl:
      'https://images.unsplash.com/photo-1570116526048-af9c32160b64?q=80&w=1000',

    createdAt: '2026-01-11T13:20:00Z',

    tags: ['북촌', '한옥', '전통'],

    placeName: '북촌 한옥마을',
  },

  {
    id: 'post-7',

    lat: 37.5216,

    lng: 126.9242,

    title: '여의도 한강공원 피크닉',

    thumbnailUrl:
      'https://images.unsplash.com/photo-1533470509042-83b632943714?q=80&w=1000',

    createdAt: '2026-01-02T15:40:00Z',

    tags: ['한강', '피크닉', '여의도'],

    placeName: '여의도 한강공원',
  },

  {
    id: 'post-8',

    lat: 37.5796,

    lng: 126.977,

    title: '경복궁 야간 개관 방문기',

    thumbnailUrl:
      'https://images.unsplash.com/photo-1548115184-bc6544d06a58?q=80&w=1000',

    createdAt: '2025-12-20T20:00:00Z',

    tags: ['경복궁', '야간개장', '데이트'],

    placeName: '경복궁 광화문',
  },
];

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
export default function RecordMapPage() {
  const [activeDrawer, setActiveDrawer] = useState<
    'tag' | 'date' | 'location' | 'emotion' | null
  >(null);
  const [selectedPostId, setSelectedPostId] = useState<
    string | string[] | null
  >(null);
  const [searchedLocation, setSearchedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);

  const [searchResults, setSearchResults] = useState<
    google.maps.places.PlaceResult[]
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const placesLib = useMapsLibrary('places');
  const mapRef = useRef<google.maps.Map | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(
    null,
  );

  useEffect(() => {
    if (!placesLib || placesServiceRef.current) return;

    const dummy = document.createElement('div');
    placesServiceRef.current = new placesLib.PlacesService(dummy);
  }, [placesLib]);

  // 사용자 위치 가져오기
  const {
    latitude,
    longitude,
    loading: locationLoading,
    error: locationError,
  } = useGeolocation({
    reverseGeocode: false, // 주소 변환 불필요
  });

  // URL 쿼리 파라미터
  const {
    query,
    tags: selectedTags,
    emotions: selectedEmotions,
    start: startDate,
    end: endDate,
    updateUrl,
  } = useSearchFilters();

  // 지도 기록 데이터 가져오기
  const { data: mapData } = useQuery({
    ...mapRecordListOptions({
      lat: latitude ?? 37.5665, // 기본값: 서울 시청
      lng: longitude ?? 126.978,
      scope: 'personal',
      from: startDate || undefined,
      to: endDate || undefined,
      tags: selectedTags.length > 0 ? selectedTags.join(',') : undefined,
    }),
    enabled: latitude !== null && longitude !== null, // 위치 정보가 있을 때만 실행
  });

  // 데이터 필터링 및 표시
  const displayPosts = useMemo(() => {
    let results = mapData?.items ?? [];

    // 1. 클러스터/마커 선택 시 (필터링 우선순위 최상위)
    if (Array.isArray(selectedPostId)) {
      return results.filter((p) => selectedPostId.includes(p.id));
    }
    if (typeof selectedPostId === 'string') {
      return results.filter((p) => p.id === selectedPostId);
    }

    // 2. 검색어 필터링 (클라이언트 사이드 추가 필터)
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(
        (r) =>
          r.title.toLowerCase().includes(lowerQuery) ||
          r.placeName?.toLowerCase().includes(lowerQuery),
      );
    }

    // 나머지 필터링은 서버에서 처리됨 (tags, from, to)
    return results;
  }, [mapData, selectedPostId, query]);

  const handleBoundsChange = useCallback(
    (bounds: google.maps.LatLngBounds | null) => {
      setMapBounds(bounds);
    },
    [],
  );

  const handleSelectPlace = (place: google.maps.places.PlaceResult) => {
    if (!mapRef.current || !place.geometry?.location) return;

    const location = place.geometry.location;

    const lat = location.lat();
    const lng = location.lng();

    // 지도 해당 위치로 이동
    mapRef.current.panTo({ lat, lng });
    mapRef.current.setZoom(16);
    setSearchedLocation({ lat, lng });
  };

  const handleSearch = async (keyword: string) => {
    if (!placesServiceRef.current || !keyword.trim()) return;

    setIsProcessing(true);

    const results = await searchPlacesByKeyword(
      placesServiceRef.current,
      keyword,
    );

    setSearchResults(results.slice(0, 10));
    setIsProcessing(false);
  };

  const handleClearSearch = () => {
    setSearchedLocation(null);
    setSearchResults([]);
  };

  return (
    <main
      vaul-drawer-wrapper=""
      className="w-full h-full relative overflow-hidden bg-white"
    >
      <LocationPermissionChecker />
      <APIProvider apiKey={apiKey!}>
        <div className="absolute inset-0 z-0">
          <GoogleMap
            posts={displayPosts}
            selectedPostId={selectedPostId}
            onSelectPost={setSelectedPostId}
            onBoundsChange={handleBoundsChange}
            onMapClick={() => setSelectedPostId(null)}
            mapRef={mapRef}
            placesServiceRef={placesServiceRef}
            searchedLocation={searchedLocation}
          />
        </div>

        {/* 검색 및 필터*/}
        <div className="absolute top-4 left-0 w-full z-10 px-4">
          <div className="flex flex-col gap-3">
            <MapSearchBar
              onSelect={handleSelectPlace}
              placeholder="장소를 검색하세요"
              searchResults={searchResults}
              onSearch={handleSearch}
              isSearching={isProcessing}
              hasSelectedLocation={!!searchedLocation}
              onClear={handleClearSearch}
            />
            <div className="flex gap-2 overflow-x-auto hide-scrollbar">
              <FilterChip
                type="tag"
                label={makeTagLabel(selectedTags)}
                isActive={selectedTags.length > 0}
                onClick={() => setActiveDrawer('tag')}
                onClear={() => updateUrl({ tags: null })}
                className="rounded-2xl"
              />
              <FilterChip
                type="emotion"
                label={makeEmotionLabel(selectedEmotions)}
                isActive={selectedEmotions.length > 0}
                onClick={() => setActiveDrawer('emotion')}
                onClear={() => updateUrl({ emotions: null })}
                className="rounded-2xl"
              />
              <FilterChip
                type="date"
                label={makeDateLabel(startDate, endDate)}
                isActive={!!startDate}
                onClick={() => setActiveDrawer('date')}
                onClear={() => updateUrl({ start: null, end: null })}
                className="rounded-2xl"
              />
            </div>
          </div>
        </div>
        <RecordMapDrawer
          posts={displayPosts}
          selectedPostId={selectedPostId}
          onSelectPost={setSelectedPostId}
          isLoading={isLoading}
        />
        <FilterDrawerRenderer
          activeDrawer={activeDrawer}
          close={() => setActiveDrawer(null)}
          tags={selectedTags}
          emotions={selectedEmotions}
          dateRange={{ start: startDate, end: endDate }}
          onUpdateUrl={updateUrl}
        />
      </APIProvider>
    </main>
  );
}
