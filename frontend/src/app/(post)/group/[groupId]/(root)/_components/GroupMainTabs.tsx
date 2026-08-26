'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useLayoutEffect, useState } from 'react';
import { LayoutGrid, Newspaper } from 'lucide-react';
import WeekCalendar from '@/app/(main)/_components/WeekCalendar';
import RecordTimelineFeed from '@/app/(main)/_components/RecordTimelineFeed';
import { RecordTimelineProvider } from '@/app/(main)/_components/RecordTimelineProvider';
import MonthRecordsInfinite from '@/app/(post)/_components/MonthRecordsInfinite';
import { Suspense } from 'react';
import { RecordItemSkeleton } from '@/app/(main)/_components/HomePageSkeleton';
import WeekCalendarSkeleton from '@/app/(main)/_components/WeekCalendarSkeleton';
import { useQuery } from '@tanstack/react-query';
import { groupCurrentMembersOption } from '@/lib/api/group';
import { formatDateISO } from '@/lib/date';
import AssetImage from '@/components/AssetImage';
import Image from 'next/image';
import ScrollToTopButton from '@/components/ScrollToTopButton';

interface GroupMainTabsProps {
  groupId: string;
}

export default function GroupMainTabs({ groupId }: GroupMainTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isArchive = searchParams.get('tab') === 'archive';

  const { data: membersData } = useQuery(groupCurrentMembersOption(groupId));
  const members = membersData?.members ?? [];

  // sticky 요소는 다른 sticky 요소와 자동으로 겹치지 않게 쌓이지 않는다 —
  // 이 캘린더를 GroupHeader 바로 아래에 고정하려면 GroupHeader의 실제
  // 높이를 top으로 직접 넘겨야 한다. 그룹 이름 줄바꿈/반응형 브레이크포인트/
  // 네이티브 safe-area에 따라 높이가 바뀌므로 ResizeObserver로 추적한다.
  const [groupHeaderHeight, setGroupHeaderHeight] = useState(0);

  useLayoutEffect(() => {
    let cancelled = false;
    let rafId: number | undefined;
    let observer: ResizeObserver | undefined;
    let attempts = 0;

    const attach = () => {
      if (cancelled) return;
      const header = document.getElementById('group-header-sticky');
      if (!header) {
        if (attempts++ < 120) rafId = requestAnimationFrame(attach);
        return;
      }

      const updateHeight = () =>
        setGroupHeaderHeight(header.getBoundingClientRect().height);
      updateHeight();
      observer = new ResizeObserver(updateHeight);
      observer.observe(header);
    };
    attach();

    return () => {
      cancelled = true;
      if (rafId !== undefined) cancelAnimationFrame(rafId);
      observer?.disconnect();
    };
  }, []);

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {members.slice(0, 4).map((m) => (
            <div
              key={m.memberId}
              className="w-7 h-7 bg-white rounded-full overflow-hidden border-2 shadow-sm dark:border-[#121212] border-white"
            >
              {m.profileImageId ? (
                <AssetImage
                  width={28}
                  height={28}
                  assetId={m.profileImageId}
                  alt="멤버의 프로필"
                  className="w-full h-full rounded-full object-cover"
                  wrapperClassName="w-full h-full"
                />
              ) : (
                <Image
                  width={28}
                  height={28}
                  src="/profile_base.png"
                  alt="멤버의 프로필"
                  className="w-full h-full rounded-full object-cover"
                />
              )}
            </div>
          ))}
          {members.length > 4 && (
            <div className="w-7 h-7 rounded-full border-2 shadow-sm bg-gray-100 dark:bg-gray-800 dark:border-[#121212] border-white flex items-center justify-center">
              <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300">
                +{members.length - 4}
              </span>
            </div>
          )}
        </div>

        <div
          data-tutorial-id="tutorial-group-tabs"
          className="flex gap-0.5 p-0.5 rounded-lg bg-gray-100 dark:bg-white/5"
        >
          <button
            onClick={() => router.replace(`/group/${groupId}`)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-all ${
              !isArchive
                ? 'bg-white dark:bg-[#1E1E1E] text-itta-black dark:text-white shadow-sm'
                : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            <Newspaper className="w-3 h-3" />
            피드
          </button>
          <button
            onClick={() => router.replace(`/group/${groupId}?tab=archive`)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-all ${
              isArchive
                ? 'bg-white dark:bg-[#1E1E1E] text-itta-black dark:text-white shadow-sm'
                : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            <LayoutGrid className="w-3 h-3" />
            보관함
          </button>
        </div>
      </div>

      {isArchive ? (
        <div className="pt-3">
          <MonthRecordsInfinite
            groupId={groupId}
            cardRoute={`/group/${groupId}/month`}
          />
        </div>
      ) : (
        <RecordTimelineProvider key={groupId} initialDate={formatDateISO()}>
          <div className="min-h-0 flex-1 flex flex-col gap-4 pb-bottom-nav">
            <Suspense
              fallback={<WeekCalendarSkeleton className="-mx-4 sm:-mx-6" />}
            >
              <WeekCalendar
                monthBasePath={`/group/${groupId}`}
                className="-mx-4 sm:-mx-6"
                stickyTopClassName="top-0"
                stickyTopPx={groupHeaderHeight}
              />
            </Suspense>
            <Suspense
              fallback={
                <div className="space-y-3 sm:space-y-4 w-full">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <RecordItemSkeleton key={i} />
                  ))}
                </div>
              }
            >
              <RecordTimelineFeed groupId={groupId} imageLayout="responsive" />
            </Suspense>
          </div>
        </RecordTimelineProvider>
      )}
      <ScrollToTopButton stackedAboveDraftButton />
    </div>
  );
}
