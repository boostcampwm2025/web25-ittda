'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useLayoutEffect, useState } from 'react';
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

  const [groupHeaderHeight, setGroupHeaderHeight] = useState(0);

  // TEMP DEBUG — 원인 진단용, 확인 끝나면 제거할 것
  const [debugText, setDebugText] = useState('');
  useEffect(() => {
    const update = () => {
      const gh = document.getElementById('group-header-sticky');
      const cal = document.getElementById('week-calendar-sticky');
      const ghRect = gh?.getBoundingClientRect();
      const calRect = cal?.getBoundingClientRect();
      const ghCS = gh ? getComputedStyle(gh) : null;
      setDebugText(
        `state=${groupHeaderHeight} realH=${ghRect?.height.toFixed(0)} ghBottom=${ghRect?.bottom.toFixed(0)} calTop=${calRect?.top.toFixed(0)} ` +
          `pt=${ghCS?.paddingTop} mt=${ghCS?.marginTop} stacked=${gh?.getAttribute('data-stacked-header')} y=${window.scrollY}`,
      );
    };
    update();
    const id = setInterval(update, 300);
    return () => clearInterval(id);
  }, [groupHeaderHeight]);

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
    <div className="h-full flex flex-col gap-4 ">
      {/* TEMP DEBUG — 원인 진단용, 확인 끝나면 제거할 것 */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 99999,
          background: 'red',
          color: 'white',
          fontSize: 9,
          padding: 4,
          wordBreak: 'break-all',
          pointerEvents: 'none',
        }}
      >
        {debugText}
      </div>
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
                blurred={false}
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
