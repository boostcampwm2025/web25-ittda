'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { MapPin, Clock, Map as MapIcon, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { MapPostItem } from '@/lib/types/record';
import { useBottomSheet } from '../_hooks/useBottomSheet';

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
  const [snapPoints, setSnapPoints] = useState({
    collapsed: 100,
    half: 550,
    full: 750,
  });

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

  const { height, isDragging, onPointerDown, onPointerMove, onPointerUp } =
    useBottomSheet(snapPoints);

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
                const isHighlighted = selectedPostId === post.id;

                return (
                  // TODO : 별도 컴포넌트 분리(SearchItem과 합치는 것도 고려)
                  <div
                    key={post.id}
                    data-post-id={post.id}
                    onClick={() => router.push(`/record/${post.id}`)}
                    className={cn(
                      'flex items-center gap-5 p-5 rounded-3xl border transition-all duration-300 group cursor-pointer active:scale-[0.97]',
                      isHighlighted
                        ? 'border-[#10B981] bg-[#10B981]/5 shadow-md scale-[1.02] ring-1 ring-[#10B981]/30'
                        : 'dark:border-white/5 border-gray-100 bg-white dark:bg-white/[0.02] shadow-sm hover:border-[#10B981]/30',
                    )}
                  >
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 shrink-0 border border-black/5">
                      <Image
                        src={post.imageUrl}
                        alt={post.title}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <h4
                        className={cn(
                          'font-bold truncate text-sm transition-colors',
                          isHighlighted ? 'text-[#10B981]' : 'dark:text-white',
                        )}
                      >
                        {post.title}
                      </h4>
                      <p className="text-[11px] text-itta-gray3 flex items-center gap-1.5 font-medium">
                        <MapPin className="w-3 h-3 text-itta-point" />
                        {post.placeName}
                      </p>
                      <p className="text-[11px] text-itta-gray3 flex items-center gap-1.5 font-medium">
                        <Clock className="w-3 h-3 text-itta-point" />
                        {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {post.tags.slice(0, 2).map((tag: string) => (
                          <span
                            key={tag}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-md dark:bg-white/5 bg-[#F9F9F9]"
                          >
                            <span className="text-[#10B981] font-bold">#</span>
                            <span className="dark:text-gray-400 text-gray-600">
                              {tag}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                    <ChevronRight
                      size={18}
                      className={cn(
                        'transition-colors',
                        isHighlighted ? 'text-[#10B981]' : 'text-gray-300',
                      )}
                    />
                  </div>
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
