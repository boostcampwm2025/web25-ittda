// app/map/page.tsx
'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { APIProvider, Map, Marker, useMap } from '@vis.gl/react-google-maps';
import { useQuery } from '@tanstack/react-query';
import { fetchPostsByBbox } from '@/_lib/api/posts';
import type { TemplateType, PostListItem } from '../_lib/types/post';

type Bbox = { minLat: number; minLng: number; maxLat: number; maxLng: number };

const TEMPLATE_LABEL: Record<TemplateType, string> = {
  diary: '일기',
  travel: '여행',
  movie: '영화',
  musical: '뮤지컬',
  theater: '연극',
  memo: '메모',
  etc: '기타',
};

// 1) 일단 임시 bbox (서울 근처)
// 다음 단계에서 "지도 bounds → bbox"로 바꿀 것
const TEST_BBOX: Bbox = {
  minLat: 37.4,
  minLng: 126.8,
  maxLat: 37.7,
  maxLng: 127.2,
};

function FlyToOnSelect({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    map.panTo({ lat, lng });
    // 필요하면 줌도 고정
    // map.setZoom(13);
  }, [map, lat, lng]);
  return null;
}

export default function MapPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['posts', 'bbox', TEST_BBOX],
    queryFn: () => fetchPostsByBbox(TEST_BBOX),
    // items만 뽑아 쓰면 페이지가 편해짐
    select: (res) => res.items,
  });

  const posts = data ?? [];

  const selectedPost = useMemo(
    () => posts.find((p) => p.id === selectedId) ?? null,
    [posts, selectedId],
  );

  // 패널에서 선택된 항목으로 스크롤(선택)
  const listRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!selectedId) return;
    const el = listRef.current?.querySelector<HTMLDivElement>(
      `[data-post-id="${selectedId}"]`,
    );
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedId]);

  if (!apiKey) return <div>API KEY가 없습니다 (.env.local 확인)</div>;
  if (isLoading) return <div>로딩중...</div>;
  if (isError) return <div>데이터 로드 실패</div>;

  return (
    <div className="flex h-screen">
      {/* Left Panel */}
      <aside className="w-80 border-r overflow-y-auto" ref={listRef}>
        <div className="p-3 border-b font-semibold">
          주변 게시글{' '}
          <span className="text-sm text-gray-500">({posts.length})</span>
        </div>

        {posts.map((post) => {
          const active = post.id === selectedId;

          return (
            <div
              key={post.id}
              data-post-id={post.id}
              onClick={() => setSelectedId(post.id)}
              className={[
                'cursor-pointer p-3 border-b',
                active ? 'bg-gray-100' : 'hover:bg-gray-50',
              ].join(' ')}
            >
              {/* 상단: 템플릿 + 날짜 */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                  {TEMPLATE_LABEL[post.templateType]}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* 제목 */}
              <div className="font-medium text-sm mb-1 truncate">
                {post.title}
              </div>

              {/* 미리보기 */}
              <div className="text-xs text-gray-600 line-clamp-2">
                {post.preview}
              </div>
            </div>
          );
        })}
      </aside>

      {/* Map */}
      <main className="flex-1">
        <APIProvider apiKey={apiKey}>
          <div className="w-full h-full">
            <Map
              defaultCenter={{ lat: 37.5665, lng: 126.978 }}
              defaultZoom={12}
              gestureHandling="greedy"
              disableDefaultUI={false}
            >
              {posts.map((post) => (
                <Marker
                  key={post.id}
                  position={{ lat: Number(post.lat), lng: Number(post.lng) }}
                  onClick={() => setSelectedId(post.id)} // 핀 클릭 → 패널 선택
                />
              ))}

              {/* 패널 선택 → 지도 이동 */}
              {selectedPost && (
                <FlyToOnSelect
                  lat={Number(selectedPost.lat)}
                  lng={Number(selectedPost.lng)}
                />
              )}
            </Map>
          </div>
        </APIProvider>
      </main>
    </div>
  );
}
