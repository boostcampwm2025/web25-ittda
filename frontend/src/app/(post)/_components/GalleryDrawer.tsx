'use client';

import { cn } from '@/lib/utils';
import { Check, ImageIcon } from 'lucide-react';
import { useCallback, useMemo, useRef } from 'react';
import { DrawerClose } from '../../../components/ui/drawer';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  groupRecordCoverOptions,
  groupMonthlyRecordCoverOptions,
} from '@/lib/api/group';
import { myMonthlyRecordCoverOptions } from '@/lib/api/my';
import AssetImage from '@/components/AssetImage';
import { ResetDefaultCoverButton } from '@/components/ResetDefaultCoverButton';

interface GalleryDrawerProps {
  type: 'group' | 'personal' | 'other';
  groupId?: string;
  month?: string;
  currentAssetId?: string;
  onSelect: (mediaId: string, recordId: string) => void;
}

export default function GalleryDrawer({
  type,
  groupId,
  month,
  currentAssetId,
  onSelect,
}: GalleryDrawerProps) {
  // 그룹 쿼리
  const groupQuery = useInfiniteQuery({
    ...groupRecordCoverOptions(groupId!),
    enabled: type === 'group' && !!groupId && !month,
  });

  // 그룹 웗별 쿼리
  const groupMonthlyQuery = useInfiniteQuery({
    ...groupMonthlyRecordCoverOptions(groupId!, month!),
    enabled: type === 'group' && !!groupId && !!month,
  });

  // 개인 월별 쿼리
  const personalQuery = useInfiniteQuery({
    ...myMonthlyRecordCoverOptions(month!),
    enabled: type === 'personal',
  });

  const currentQuery = useMemo(() => {
    if (type === 'group') {
      return month ? groupMonthlyQuery : groupQuery;
    }
    return personalQuery;
  }, [type, month, groupMonthlyQuery, groupQuery, personalQuery]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = currentQuery;

  const items = (data?.pages ?? []).flatMap((page) =>
    (page?.sections ?? []).flatMap((section) => section.items ?? []),
  );

  // 무한 스크롤 관찰자
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
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
        { root: scrollContainerRef.current, rootMargin: '100px' },
      );

      if (node) observerRef.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage],
  );

  return (
    <div className="flex flex-col w-full gap-2.5">
      {items.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 rounded-3xl border-2 border-dashed border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-white/5">
          <div className="w-16 h-16 bg-white dark:bg-neutral-800 rounded-2xl flex items-center justify-center shadow-sm">
            <ImageIcon className="w-8 h-8 text-gray-300 dark:text-neutral-600" />
          </div>

          <div className="space-y-1">
            <p className="font-bold text-itta-black dark:text-white text-sm">
              이미지가 포함된 기록이 없어요
            </p>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              커버로 설정할 수 있는 사진이 포함된
              <br />
              기록을 먼저 작성해 보세요!
            </p>
          </div>
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          className="p-1 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[45vh] overflow-y-auto scrollbar-hide mb-8 min-h-0"
        >
          {items.map((item, idx) => {
            const isCurrent = currentAssetId === item.mediaId;
            const isLastItem = idx === items.length - 1;

            return (
              <div
                key={item.mediaId}
                ref={isLastItem ? lastItemRef : null} // 마지막 아이템에 ref 연결
                className="relative w-full aspect-square"
              >
                <DrawerClose asChild>
                  <button
                    onClick={() => onSelect(item.mediaId, item.postId)}
                    className={cn(
                      'absolute inset-0 w-full h-full cursor-pointer rounded-xl overflow-hidden transition-all active:scale-95 border-2 shadow-sm dark:border-[#121212] border-white',
                      isCurrent ? 'border-[#10B981]' : 'border-transparent',
                    )}
                  >
                    <AssetImage
                      assetId={item.mediaId}
                      alt={item.postTitle}
                      className="object-cover w-full h-full"
                      fill
                      sizes="(max-width: 640px) 33vw, 25vw"
                    />
                    {isCurrent && (
                      <div className="absolute inset-0 bg-[#10B981]/20 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-[#10B981] flex items-center justify-center shadow-lg">
                          <Check
                            className="w-4 h-4 text-white"
                            strokeWidth={3}
                          />
                        </div>
                      </div>
                    )}
                  </button>
                </DrawerClose>
              </div>
            );
          })}
          {isFetchingNextPage && (
            <div className="col-span-full flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}
      <ResetDefaultCoverButton />
      <DrawerClose className="cursor-pointer w-full py-4 rounded-2xl font-bold text-sm dark:bg-white dark:text-black bg-itta-black text-white shrink-0">
        닫기
      </DrawerClose>
    </div>
  );
}
