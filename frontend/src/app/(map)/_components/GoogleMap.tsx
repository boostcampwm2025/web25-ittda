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
      // 마커를 오른쪽으로 보이게 하려면
      // 지도 중심을 왼쪽으로 옮겨야 해서 -offsetX
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
        style={{ left: `${filterWidth}px` }}
      >
        <Searchbar className="w-full" onCalendarClick={() => {}} />
        <div className="flex gap-2.5 mt-2">
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
            연극
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
            <Clapperboard size={16} color="var(--itta-point)" />
            영화
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
