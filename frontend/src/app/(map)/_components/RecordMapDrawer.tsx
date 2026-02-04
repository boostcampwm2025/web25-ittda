'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import { Loader2, Map as MapIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { MapPostItem } from '@/lib/types/record';
import { useBottomSheetResize } from '../_hooks/useBottomSheetResize';
import { MapRecordItem } from './MapRecordItem';

interface Props {
  posts: MapPostItem[];
  selectedPostId: string | string[] | null; // 단일 ID 또는 클러스터 ID
  onSelectPost: (id: string | string[] | null) => void;
  isLoading: boolean;
  lastItemRef?: (node: HTMLDivElement | null) => void;
  isFetchingNextPage?: boolean;
  topOffset?: number; // PWA 배너 등의 상단 오프셋
}

export default function RecordMapDrawer({
  posts,
  selectedPostId,
  onSelectPost,
  isLoading,
  lastItemRef,
  isFetchingNextPage,
  topOffset = 0,
}: Props) {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastSnappedIdRef = useRef<string | string[] | null>(null);
  const prevSelectedPostIdRef = useRef<string | string[] | null>(
    selectedPostId,
  );

  // TODO : 백엔드 연결 (클러스터 선택 시 표시할 포스트 필터링)
  const displayPosts = useMemo(() => {
    if (Array.isArray(selectedPostId)) {
      return posts.filter((p) => selectedPostId.includes(p.id));
    }
    return posts;
  }, [posts, selectedPostId]);

  // 선택된 단일 ID가 바뀔 때 자동 스크롤 (데이터 로딩 완료 후)
  useEffect(() => {
    if (
      typeof selectedPostId === 'string' &&
      selectedPostId &&
      scrollContainerRef.current &&
      !isLoading // 로딩 중이 아닐 때만
    ) {
      // DOM 업데이트를 기다리기 위해 다음 리렌더링 직전에 적용
      const ra = requestAnimationFrame(() => {
        const targetElement = scrollContainerRef.current?.querySelector(
          `[data-post-id="${selectedPostId}"]`,
        );

        if (targetElement && scrollContainerRef.current) {
          // drawer 상단 padding을 고려하여 스크롤
          const container = scrollContainerRef.current;
          const elementTop = (targetElement as HTMLElement).offsetTop;
          const offset = 16; // pt-4 = 16px 상단 여백

          container.scrollTo({
            top: elementTop - offset,
            behavior: 'smooth',
          });
        }
      });

      return () => cancelAnimationFrame(ra);
    }
  }, [selectedPostId, displayPosts, isLoading]);

  const {
    height,
    isDragging,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    snapTo,
  } = useBottomSheetResize({ topOffset });

  useEffect(() => {
    const prevId = prevSelectedPostIdRef.current;
    prevSelectedPostIdRef.current = selectedPostId;

    // 이전에 ID가 있었는데 null이 된 경우 (지도 클릭) drawer 내리기
    if (prevId !== null && selectedPostId === null && !isDragging) {
      snapTo('collapsed');
      lastSnappedIdRef.current = null;
      return;
    }

    // 새로운 postID를 클릭했을 때 처음 한 번만 튀어오르게 기억하는 용도
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
        'absolute left-0 right-0 bottom-0 z-50 flex flex-col bg-white dark:bg-[#1E1E1E] overflow-hidden shadow-[0_-15px_60px_rgba(0,0,0,0.2)]',
        !isDragging &&
          'transition-all duration-500 cubic-bezier(0.2,0.8,0.2,1)',
      )}
      onClick={() => onSelectPost(null)}
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
          className="absolute inset-0 px-8 pt-4 pb-16 overflow-y-auto scrollbar-hide"
          style={{ touchAction: 'pan-y' }}
        >
          <div className="space-y-4 pb-10">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center bg-white dark:bg-[#121212]">
                <Loader2 className="w-8 h-8 animate-spin text-itta-point" />
              </div>
            ) : displayPosts.length ? (
              <>
                {displayPosts.map((post, idx) => {
                  const isLastItem = idx === displayPosts.length - 1;
                  return (
                    <div key={post.id} ref={isLastItem ? lastItemRef : null}>
                      <MapRecordItem
                        post={post}
                        isHighlighted={selectedPostId === post.id}
                        onSelect={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          onSelectPost(post.id);
                        }}
                        onNavigate={() => router.push(`/record/${post.id}`)}
                      />
                    </div>
                  );
                })}
                {isFetchingNextPage && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-itta-point" />
                  </div>
                )}
              </>
            ) : (
              <div className="pt-3 flex flex-col items-center justify-center text-center space-y-4 rounded-2xl dark:bg-white/5 bg-white">
                <div className="w-14 h-14 rounded-full flex items-center justify-center dark:bg-[#10B981]/10 bg-[#10B981]/10">
                  <MapIcon className="w-6 h-6 text-[#10B981]" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold dark:text-gray-200 text-gray-700">
                    주변에 기록이 없어요
                  </p>
                  <p className="text-xs text-gray-400">
                    지도를 이동하거나 필터를 조정해보세요
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
