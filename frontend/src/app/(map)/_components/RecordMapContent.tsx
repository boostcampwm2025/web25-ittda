'use client';

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import GoogleMap from './GoogleMap';
import RecordMapDrawer from './RecordMapDrawer';
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
import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { mapRecordListOptions } from '@/lib/api/records';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useDebouncedValue } from '@/hooks/useDebounce';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Back from '@/components/Back';

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// 기본 중심 좌표 (서울 시청)
const DEFAULT_CENTER_LAT = 37.5665;
const DEFAULT_CENTER_LNG = 126.978;
// 기본 범위 (약 10km)
const DEFAULT_BOUNDS_DELTA = 0.1;

interface RecordMapContentProps {
  scope: 'personal' | 'group';
  groupId?: string;
}

export default function RecordMapContent({
  scope,
  groupId,
}: RecordMapContentProps) {
  const router = useRouter();
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
  const [mapCenter, setMapCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [bannerHeight, setBannerHeight] = useState(0);

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

  // PWA 배너 높이 측정
  useEffect(() => {
    const measureBannerHeight = () => {
      // PWA 배너는 layout.tsx에서 렌더링되므로 전체 페이지에서 찾아야 함
      const banner = document.querySelector('[data-pwa-banner]');
      if (banner) {
        setBannerHeight((banner as HTMLElement).offsetHeight);
      } else {
        setBannerHeight(0);
      }
    };

    // 초기 측정
    measureBannerHeight();

    // 배너가 동적으로 나타나거나 사라질 수 있으므로 주기적으로 확인
    const interval = setInterval(measureBannerHeight, 1000);

    return () => clearInterval(interval);
  }, []);

  // 사용자 위치 가져오기
  const { latitude, longitude } = useGeolocation({
    reverseGeocode: false, // 주소 변환 불필요
  });

  // 실제 사용할 지도 중심 (mapCenter가 있으면 사용, 없으면 사용자 위치 사용)
  const effectiveMapCenter = useMemo(() => {
    if (mapCenter) return mapCenter;
    if (latitude && longitude) return { lat: latitude, lng: longitude };
    return null;
  }, [mapCenter, latitude, longitude]);

  // 지도 중심 위치를 debounce하여 성능 최적화 (500ms)
  const debouncedMapCenter = useDebouncedValue(effectiveMapCenter, 500);

  // URL 쿼리 파라미터
  const {
    query,
    tags: selectedTags,
    emotions: selectedEmotions,
    start: startDate,
    end: endDate,
    updateUrl,
  } = useSearchFilters();

  // 지도 기록 데이터 가져오기 (debounced center 사용)
  const {
    data: mapData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    ...mapRecordListOptions({
      maxLat: mapBounds
        ? mapBounds.getNorthEast().lat()
        : DEFAULT_CENTER_LAT + DEFAULT_BOUNDS_DELTA,
      maxLng: mapBounds
        ? mapBounds.getNorthEast().lng()
        : DEFAULT_CENTER_LNG + DEFAULT_BOUNDS_DELTA,
      minLat: mapBounds
        ? mapBounds.getSouthWest().lat()
        : DEFAULT_CENTER_LAT - DEFAULT_BOUNDS_DELTA,
      minLng: mapBounds
        ? mapBounds.getSouthWest().lng()
        : DEFAULT_CENTER_LNG - DEFAULT_BOUNDS_DELTA,
      scope,
      groupId,
      emotions:
        selectedEmotions.length > 0 ? selectedEmotions.join(',') : undefined,
      from: startDate || undefined,
      to: endDate || undefined,
      tags: selectedTags.length > 0 ? selectedTags.join(',') : undefined,
    }),
    placeholderData: keepPreviousData,
    enabled:
      debouncedMapCenter !== null || (latitude !== null && longitude !== null),
  });

  // 무한 스크롤 관찰자
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastItemRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage) {
            fetchNextPage();
          }
        },
        { rootMargin: '200px' },
      );

      if (node) observerRef.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage],
  );

  // 지도에 표시할 모든 posts (필터링 없이)
  const allPosts = useMemo(() => {
    // 모든 페이지의 items를 합치기
    const allItems = mapData?.pages.flatMap((page) => page.items) ?? [];

    // 검색어 필터링만 적용
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      return allItems.filter(
        (r) =>
          r.title.toLowerCase().includes(lowerQuery) ||
          r.placeName?.toLowerCase().includes(lowerQuery),
      );
    }

    return allItems;
  }, [mapData, query]);

  // Drawer에 표시할 posts (클러스터 선택 시 필터링)
  const drawerPosts = useMemo(() => {
    if (Array.isArray(selectedPostId)) {
      return allPosts.filter((p) => selectedPostId.includes(p.id));
    }
    return allPosts;
  }, [allPosts, selectedPostId]);

  const handleBoundsChange = useCallback(
    (bounds: google.maps.LatLngBounds | null) => {
      setMapBounds(bounds);

      // 지도 중심 위치 업데이트 (서버 요청용)
      if (mapRef.current) {
        const center = mapRef.current.getCenter();
        if (center) {
          setMapCenter({ lat: center.lat(), lng: center.lng() });
        }
      }
    },
    [setMapBounds, setMapCenter],
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
            posts={allPosts}
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
        <div className="absolute top-3 sm:top-4 left-0 w-full z-10 px-3 sm:px-4">
          <div className="flex flex-col gap-2 sm:gap-3">
            <div className="flex gap-1.5 sm:gap-2 items-center">
              <Back />
              <div className="flex-1 min-w-0">
                <MapSearchBar
                  onSelect={handleSelectPlace}
                  placeholder="장소를 검색하세요"
                  searchResults={searchResults}
                  onSearch={handleSearch}
                  isSearching={isProcessing}
                  hasSelectedLocation={!!searchedLocation}
                  onClear={handleClearSearch}
                />
              </div>
            </div>
            <div className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide">
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
          posts={drawerPosts}
          selectedPostId={selectedPostId}
          onSelectPost={setSelectedPostId}
          isLoading={isLoading}
          lastItemRef={lastItemRef}
          isFetchingNextPage={isFetchingNextPage}
          topOffset={bannerHeight}
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
