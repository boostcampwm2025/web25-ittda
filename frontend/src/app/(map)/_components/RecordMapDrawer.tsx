'use client';

import { useRef, useEffect, useMemo } from 'react';
import { Map as MapIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { MapPostItem } from '@/lib/types/record';
import { useBottomSheet } from '../_hooks/useBottomSheet';
import { MapRecordItem } from './MapRecordItem';

interface Props {
  posts: MapPostItem[];
  selectedPostId: string | string[] | null; // 단일 ID 또는 클러스터 ID
  onSelectPost: (id: string | string[] | null) => void;
  isLoading: boolean;
}

export default function RecordMapDrawer({
  posts,
  selectedPostId,
  onSelectPost,
  isLoading,
}: Props) {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastSnappedIdRef = useRef<string | string[] | null>(null);

  // TODO : 백엔드 연결 (클러스터 선택 시 표시할 포스트 필터링)
  const displayPosts = useMemo(() => {
    if (Array.isArray(selectedPostId)) {
      return posts.filter((p) => selectedPostId.includes(p.id));
    }
    return posts;
  }, [posts, selectedPostId]);

  // 선택된 단일 ID가 바뀔 때 자동 스크롤
  useEffect(() => {
    if (
      typeof selectedPostId === 'string' &&
      selectedPostId &&
      scrollContainerRef.current
    ) {
      const targetElement = scrollContainerRef.current.querySelector(
        `[data-post-id="${selectedPostId}"]`,
      );

      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [selectedPostId]);

  const {
    height,
    isDragging,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    snapTo,
  } = useBottomSheet();

  useEffect(() => {
    // 샤로운 postID를 클릭했을 때 처음 한 번만 튀어오르게 기억하는 용도
    if (
      selectedPostId &&
      !isDragging &&
      lastSnappedIdRef.current !== selectedPostId
    ) {
      snapTo('half');
      lastSnappedIdRef.current = selectedPostId;
    }
  }, [selectedPostId, isDragging, snapTo]);

  return (
    <div
      className={cn(
        'absolute left-0 right-0 bottom-0 z-50 flex flex-col bg-white dark:bg-[#1E1E1E] overflow-hidden shadow-[0_-15px_60px_rgba(0,0,0,0.2)] mb-6 sm:mb-12',
        !isDragging &&
          'transition-all duration-500 cubic-bezier(0.2,0.8,0.2,1)',
      )}
      style={{ height, borderRadius: '40px 40px 0 0', touchAction: 'none' }}
    >
      <div
        className="pt-5 pb-3 cursor-ns-resize shrink-0"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div className="w-14 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full mx-auto mb-5" />
        <div className="flex items-center justify-between px-8">
          <div>
            <span className="block text-[11px] font-black text-[#10B981] uppercase tracking-[0.25em] mb-1">
              Explore Records
            </span>
            <h3 className="text-lg font-bold dark:text-white">
              {Array.isArray(selectedPostId)
                ? `선택 지역 기록 ${displayPosts.length}개`
                : `주변 기록 ${posts.length}개`}
            </h3>
          </div>
        </div>
      </div>

      {/* 리스트 영역 */}
      <div className="relative flex-1 overflow-hidden">
        <div
          ref={scrollContainerRef}
          className="absolute inset-0 px-8 pt-4 pb-16 overflow-y-auto hide-scrollbar"
          style={{ touchAction: 'pan-y' }}
        >
          <div className="space-y-4">
            {isLoading ? (
              <div className="py-24 text-center text-sm text-gray-400 animate-pulse font-medium">
                기록을 불러오는 중입니다...
              </div>
            ) : displayPosts.length ? (
              displayPosts.map((post) => {
                return (
                  <MapRecordItem
                    key={post.id}
                    post={post}
                    isHighlighted={selectedPostId === post.id}
                    onClick={() => router.push(`/record/${post.id}`)}
                  />
                );
              })
            ) : (
              <div className="py-32 flex flex-col items-center gap-4 opacity-30">
                <MapIcon className="w-14 h-14" />
                <p className="text-sm font-bold text-center">
                  주변에 기록이 없습니다.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
