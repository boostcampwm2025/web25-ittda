'use client';

import Input from '@/components/Input';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import { Calendar, Search } from 'lucide-react';
import type { PostListItem } from '@/lib/types/record';
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
        <Input className="w-full">
          <Input.Left>
            <Search className="w-5 h-5 text-itta-gray2" />
          </Input.Left>
          <Input.Field placeholder="로그 검색하기" />
          <Input.Right>
            <button
              type="button"
              onClick={() => {}}
              className="shrink-0 p-1 hover:bg-itta-gray2/10 rounded transition-colors cursor-pointer"
            >
              <Calendar className="w-5 h-5 text-itta-gray3" />
            </button>
          </Input.Right>
        </Input>
      </section>
    </div>
  );
}
