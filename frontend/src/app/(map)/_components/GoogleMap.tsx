'use client';

import Searchbar from '@/components/Searchbar';
import TagButton from '@/components/TagButton';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import {
  Calendar,
  Clapperboard,
  Film,
  LineSquiggle,
  Music2,
} from 'lucide-react';
import type { PostListItem } from '@/lib/types/post';
import { useEffect } from 'react';
import { ClusteredPostMarkers } from './ClusteredMarkers';

interface GoogleMapProps {
  posts: PostListItem[];
  leftPanelWidth: number;
  selectedPostId: string | null;
  onSelectPost: (id: string | null) => void;
  isMobile: boolean;
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
  leftPanelWidth,
  selectedPostId,
  onSelectPost,
  isMobile,
}: GoogleMapProps) {
  const filterWidth = leftPanelWidth > 500 ? 500 + 17 : leftPanelWidth + 17;

  const selectedPost = posts.find((post) => post.id === selectedPostId) ?? null;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) return <div>API KEY가 없습니다 (.env.local 확인)</div>;

  return (
    <div className="bg-yellow-50 w-full h-full relative">
      <APIProvider apiKey={apiKey!}>
        <Map
          mapId="MAP_ID"
          defaultCenter={{ lat: 37.5665, lng: 126.978 }}
          defaultZoom={12}
          gestureHandling="greedy"
          disableDefaultUI={false}
        >
          <ClusteredPostMarkers posts={posts} onSelectPost={onSelectPost} />

          {/* 패널 선택 → 지도 이동 */}
          {selectedPost && (
            <FlyToOnSelect
              lat={Number(selectedPost.lat)}
              lng={Number(selectedPost.lng)}
              offsetX={leftPanelWidth / 2} // 패널 폭의 절반만큼 오른쪽으로 보이게
            />
          )}
        </Map>
      </APIProvider>

      <section
        className="absolute top-3.5 right-4.25"
        style={{ left: isMobile ? '5px' : `${filterWidth}px` }}
      >
        <Searchbar className="w-full" onCalendarClick={() => {}} />
        <div className="flex gap-1.5 sm:gap-2.5 mt-2 overflow-x-auto whitespace-nowrap ">
          <TagButton
            onClick={() => {}}
            className="flex justify-center items-center gap-1"
          >
            <Clapperboard
              size={16}
              color="var(--itta-point)"
              className="flex justify-center items-center gap-1"
            />
            연극
          </TagButton>
          <TagButton
            onClick={() => {}}
            className="flex justify-center items-center gap-1"
          >
            <Film size={16} color="var(--itta-point)" />
            영화
          </TagButton>
          <TagButton
            onClick={() => {}}
            className="flex justify-center items-center gap-1"
          >
            <Music2 size={16} color="var(--itta-point)" />
            뮤지컬
          </TagButton>
          <TagButton
            onClick={() => {}}
            className="flex justify-center items-center gap-1"
          >
            <Calendar size={16} color="var(--itta-point)" />
            일기/여행
          </TagButton>
          <TagButton
            onClick={() => {}}
            className="flex justify-center items-center gap-1"
          >
            <LineSquiggle size={16} color="var(--itta-point)" />
            기타
          </TagButton>
        </div>
      </section>
    </div>
  );
}

/*
추가로 고려해볼 것: AdvancedMarker (선택)

기존의 google.maps.Marker는 Raster 기반으로 렌더링되어 성능 및 커스터마이징에 한계가 있었습니다. 
2024년 2월부로 권장되는 Advanced Marker는 다음과 같은 이점이 있습니다.

성능 향상: 벡터 기반 렌더링 및 하드웨어 가속을 활용하여 
대량의 마커 표시 시 성능이 우수합니다.

유연한 커스터마이징: HTML 요소를 직접 마커로 사용할 수 있어 디자인 자유도가 
매우 높습니다.

장기적 안정성: 기존 Marker는 향후 유지보수가 중단될 예정(Deprecated)

지도 ID 만들기: https://developers.google.com/maps/documentation/javascript/map-ids/get-map-id?hl=ko#javascript
(mapId: 'DEMO_MAP_ID'를 테스트 용도로 사용 가능)

예시)
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
<Map
    defaultCenter={{ lat: 37.5665, lng: 126.978 }}
    defaultZoom={12}
    gestureHandling="greedy"
    disableDefaultUI={false}
    // 2. mapId 필수 추가 (GCP 콘솔에서 생성 가능, 테스트용은 'DEMO_MAP_ID')
    mapId={'YOUR_MAP_ID_HERE'} 
  >
    {posts.map((post) => (
      // 3. AdvancedMarker로 교체
      <AdvancedMarker
        key={post.id}
        position={{ lat: Number(post.lat), lng: Number(post.lng) }}
        onClick={() => onSelectPost(post.id)}
      />
    ))}
*/
