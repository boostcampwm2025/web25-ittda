'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { LayoutGrid, Newspaper } from 'lucide-react';
import WeekCalendar from '@/app/(main)/_components/WeekCalendar';
import RecordList from '@/app/(main)/_components/RecordList';
import MonthRecords from '@/app/(post)/_components/MonthRecords';
import ErrorHandlingWrapper from '@/components/ErrorHandlingWrapper';
import ErrorFallback from '@/components/ErrorFallback';
import MonthRecordsSkeleton from '@/app/(post)/_components/MonthRecordsSkeleton';
import { Suspense } from 'react';
import HomePageSkeleton from '@/app/(main)/_components/HomePageSkeleton';
import WeekCalendarSkeleton from '@/app/(main)/_components/WeekCalendarSkeleton';

interface GroupMainTabsProps {
  groupId: string;
}

export default function GroupMainTabs({ groupId }: GroupMainTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isArchive = searchParams.get('tab') === 'archive';

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-white/5">
        <button
          onClick={() => router.push(`/group/${groupId}`)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-bold transition-all ${
            !isArchive
              ? 'bg-white dark:bg-[#1E1E1E] text-itta-black dark:text-white shadow-sm'
              : 'text-gray-400 dark:text-gray-500'
          }`}
        >
          <Newspaper className="w-3.5 h-3.5" />
          피드
        </button>
        <button
          onClick={() => router.push(`/group/${groupId}?tab=archive`)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-bold transition-all ${
            isArchive
              ? 'bg-white dark:bg-[#1E1E1E] text-itta-black dark:text-white shadow-sm'
              : 'text-gray-400 dark:text-gray-500'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          보관함
        </button>
      </div>

      {isArchive ? (
        <ErrorHandlingWrapper
          fallbackComponent={ErrorFallback}
          suspenseFallback={<MonthRecordsSkeleton />}
        >
          <MonthRecords
            groupId={groupId}
            cardRoute={`/group/${groupId}/month`}
          />
        </ErrorHandlingWrapper>
      ) : (
        <div className="min-h-0 flex-1 flex flex-col gap-4 pb-bottom-nav">
          <Suspense fallback={<WeekCalendarSkeleton />}>
            <WeekCalendar
              basePath={`/group/${groupId}`}
              monthBasePath={`/group/${groupId}`}
            />
          </Suspense>
          <Suspense fallback={<HomePageSkeleton />}>
            <RecordList groupId={groupId} imageLayout="responsive" />
          </Suspense>
        </div>
      )}
    </div>
  );
}
