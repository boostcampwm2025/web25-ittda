'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useRef, useState } from 'react';
import GalleryDrawer from '@/app/(post)/_components/GalleryDrawer';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { BookOpen, Loader2, Plus, X } from 'lucide-react';
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import {
  MontlyCoverUpdateResponse,
  PaginatedMonthlyRecordListResponse,
} from '@/lib/types/recordResponse';
import { useApiPatch } from '@/hooks/useApi';
import { myMonthlyRecordInfiniteOptions } from '@/lib/api/my';
import {
  groupMonthlyRecordInfiniteOptions,
  groupMyRoleOptions,
} from '@/lib/api/group';
import { convertMontRecords } from '@/app/(post)/_utils/convertMonthRecords';
import { MonthCard, ConvertedMonthRecord } from './MonthRecords';
import MonthRecordsSkeleton from './MonthRecordsSkeleton';

const CURRENT_YEAR = String(new Date().getFullYear());

interface MonthRecordsInfiniteProps {
  cardRoute: string;
  groupId?: string;
}

type RenderItem =
  | { type: 'header'; key: string; year: string }
  | { type: 'month'; key: string; month: ConvertedMonthRecord };

const MonthRecordsInfinite = ({
  groupId,
  cardRoute,
}: MonthRecordsInfiniteProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [activeMonthId, setActiveMonthId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const options = groupId
    ? groupMonthlyRecordInfiniteOptions(groupId)
    : myMonthlyRecordInfiniteOptions();

  const cacheKey = groupId
    ? ['group', groupId, 'records', 'month', 'all']
    : ['my', 'records', 'month', 'all'];

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending } =
    useInfiniteQuery(options);

  // 그룹 게시글인 경우 권한 확인
  const { data: roleData } = useQuery({
    ...groupMyRoleOptions(groupId!),
    enabled: !!groupId,
  });

  const isViewer = roleData?.role === 'VIEWER';
  const canChangeCover = !(groupId && isViewer);

  const months = useMemo(
    () => convertMontRecords((data?.pages ?? []).flatMap((page) => page.items)),
    [data],
  );

  // 연속된 월 목록을 연도 구분 헤더와 함께 한 줄로 펼친다
  const renderItems = useMemo(() => {
    const items: RenderItem[] = [];
    let lastYear: string | null = null;
    for (const month of months) {
      const year = month.id.slice(0, 4);
      if (year !== lastYear) {
        items.push({ type: 'header', key: `year-${year}`, year });
        lastYear = year;
      }
      items.push({ type: 'month', key: month.id, month });
    }
    return items;
  }, [months]);

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

  const handleNavigate = useCallback(
    (monthId: string) => {
      router.push(`${cardRoute}/${monthId}`);
    },
    [router, cardRoute],
  );

  const openGallery = useCallback((monthId: string) => {
    setActiveMonthId(monthId);
    setIsDrawerOpen(true);
  }, []);

  const coverEndpoint = groupId
    ? `/api/groups/${groupId}/archives/months/${activeMonthId}/cover`
    : `/api/user/archives/months/${activeMonthId}/cover`;

  const updateMonthCoverCache = useCallback(
    (assetId: string) => {
      queryClient.setQueryData<
        InfiniteData<PaginatedMonthlyRecordListResponse>
      >(cacheKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.month === activeMonthId
                ? { ...item, coverAssetId: assetId }
                : item,
            ),
          })),
        };
      });
    },
    [queryClient, cacheKey, activeMonthId],
  );

  const { mutate: updateCover } = useApiPatch<MontlyCoverUpdateResponse>(
    coverEndpoint,
    {
      onSuccess: (response) => {
        if (!response.data) return;
        updateMonthCoverCache(response.data.coverAssetId);
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: cacheKey });
      },
    },
  );

  const handleCoverSelect = (assetId: string, recordId: string) => {
    if (!activeMonthId) return;

    // 낙관적 업데이트
    updateMonthCoverCache(assetId);

    updateCover(groupId ? { assetId, sourcePostId: recordId } : { assetId });
  };

  if (isPending) {
    return <MonthRecordsSkeleton />;
  }

  if (months.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center justify-center text-center space-y-4 rounded-2xl border border-dashed dark:bg-white/5 dark:border-white/10 bg-white border-gray-200">
        <div className="w-14 h-14 rounded-full flex items-center justify-center dark:bg-[#10B981]/10 bg-[#10B981]/10">
          <BookOpen className="w-6 h-6 text-[#10B981]" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold dark:text-gray-200 text-gray-700">
            아직 기록이 없어요
          </p>
          <p className="text-xs text-gray-400">첫 번째 추억을 남겨보세요</p>
        </div>
        <button
          type="button"
          onClick={() =>
            !isViewer &&
            (groupId
              ? router.push(`/add?groupId=${groupId}`)
              : router.push('/add'))
          }
          disabled={groupId ? isViewer : false}
          className={`mt-2 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all ${
            groupId && isViewer
              ? 'opacity-50 cursor-not-allowed bg-gray-400 text-gray-200 shadow-gray-400/20'
              : 'text-white bg-itta-black shadow-itta-black/20 hover:bg-itta-black/80 active:scale-95'
          }`}
        >
          <Plus className="w-4 h-4" />
          기록 추가하기
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 pb-bottom-nav">
        {renderItems.map((item, index) => {
          if (item.type === 'header') {
            return (
              <div
                key={item.key}
                className="col-span-full flex items-baseline gap-2 mt-2 first:mt-0"
              >
                <span className="text-sm sm:text-base font-bold dark:text-white text-[#222]">
                  {item.year === CURRENT_YEAR ? '이번 해' : `${item.year}년`}
                </span>
                <span className="text-xs text-gray-400">
                  {item.year === CURRENT_YEAR
                    ? '이번 해의 월별 기록이에요'
                    : '월별 기록이에요'}
                </span>
              </div>
            );
          }

          const isLastItem = index === renderItems.length - 1;

          return (
            <div key={item.key} ref={isLastItem ? lastItemRef : null}>
              <MonthCard
                month={item.month}
                onNavigate={handleNavigate}
                onChangeCover={openGallery}
                canChangeCover={canChangeCover}
                priorityLoad={item.month.id === months[0]?.id}
              />
            </div>
          );
        })}

        {isFetchingNextPage && (
          <div className="col-span-full flex justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-itta-point" />
          </div>
        )}
      </div>

      {/* 커버 변경 Drawer */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="w-full px-6 sm:px-8 pt-4 pb-8 sm:pb-10">
          <DrawerHeader>
            <div className="pt-4 flex justify-between items-center mb-4 sm:mb-6">
              <DrawerTitle className="flex flex-col justify-center items-start pl-0">
                <span className="text-[9px] sm:text-[10px] font-bold text-[#10B981] uppercase tracking-widest leading-none mb-1">
                  CHOOSE COVER
                </span>
                <span className="text-base sm:text-xl font-bold dark:text-white text-itta-black">
                  커버 사진 선택
                </span>
              </DrawerTitle>
              <DrawerClose className="sm:p-2 text-gray-400 cursor-pointer">
                <X className="w-6 h-6" />
              </DrawerClose>
            </div>
          </DrawerHeader>

          <GalleryDrawer
            groupId={groupId}
            month={activeMonthId!}
            type={groupId ? 'group' : 'personal'}
            currentAssetId={
              months.find((m) => m.id === activeMonthId)?.cover?.assetId
            }
            onSelect={handleCoverSelect}
          />
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default MonthRecordsInfinite;
