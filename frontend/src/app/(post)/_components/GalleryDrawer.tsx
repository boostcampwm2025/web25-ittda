import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useRef } from 'react';
import { DrawerClose } from '../../../components/ui/drawer';
import { CoverSection } from '@/lib/types/recordResponse';
import { useInfiniteQuery } from '@tanstack/react-query';
import { groupRecordCoverOptions } from '@/lib/api/group';

interface GalleryDrawerProps {
  groupId?: string;
  currentAssetId?: string;
  onSelect: (assetId: string, recordId: string) => void;
}

export default function GalleryDrawer({
  groupId,
  currentAssetId,
  onSelect,
}: GalleryDrawerProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      ...groupRecordCoverOptions(groupId ?? ''),
      enabled: !!groupId,
    });

  // 모든 페이지의 sections 합치기
  const allSections: CoverSection[] =
    data?.pages.flatMap((page) => page.sections) ?? [];

  // 무한 스크롤을 위한 observer
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
        {
          root: scrollContainerRef.current,
          rootMargin: '100px',
          threshold: 0,
        },
      );

      if (node) observerRef.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage],
  );

  // 모든 이미지 아이템 flat하게 펼치기
  const allItems = allSections.flatMap((section) => section.items);

  return (
    <div className="flex flex-col w-full">
      {allItems.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 rounded-2xl dark:bg-white/5 bg-white">
          <p className="font-bold text-[#10B981] text-xs">
            이미지가 포함된 기록이 없습니다.
          </p>
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[45vh] overflow-y-auto scrollbar-hide mb-8 min-h-0"
        >
          {allItems.map((item, idx) => {
            const isCurrent = currentAssetId === item.assetId;
            const isLastItem = idx === allItems.length - 1;

            return (
              <div
                key={item.mediaId}
                ref={isLastItem ? lastItemRef : null}
                className="relative w-full aspect-square"
              >
                <DrawerClose asChild>
                  <button
                    onClick={() => onSelect(item.assetId, item.postId)}
                    className={cn(
                      'absolute inset-0 w-full h-full cursor-pointer rounded-xl overflow-hidden transition-all active:scale-95 border-2',
                      isCurrent ? 'border-[#10B981]' : 'border-transparent',
                    )}
                  >
                    <Image
                      src={item.assetId}
                      className="object-cover"
                      alt={item.postTitle}
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

      <DrawerClose className="cursor-pointer w-full py-4 rounded-2xl font-bold text-sm dark:bg-white/5 dark:text-gray-500 bg-itta-black text-white shrink-0">
        닫기
      </DrawerClose>
    </div>
  );
}
