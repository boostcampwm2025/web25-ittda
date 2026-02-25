import MonthlyDetailHeaderActions from '@/app/(post)/_components/MonthlyDetailHeaderActions';
import MonthlyDetailRecordsSkeleton from '@/app/(post)/_components/MonthlyDetailRecordsSkeleton';
import { Suspense } from 'react';
import GroupMonthlyDetailData from './_components/GroupMonthlyDetailData';

interface GroupMonthlyDetailPageProps {
  params: Promise<{ month: string; groupId: string }>;
}

export default async function GroupMonthlyDetailPage({
  params,
}: GroupMonthlyDetailPageProps) {
  const { groupId, month } = await params;

  return (
    <div className="h-full transition-colors duration-300 dark:bg-[#121212] bg-[#FDFDFD]">
      <div className="py-3 px-4 sm:py-6 sm:px-6 sticky top-0 z-50 transition-colors duration-300 dark:bg-[#121212] bg-white">
        <header className="flex items-center justify-between">
          <MonthlyDetailHeaderActions month={month} title="Together archive" />
        </header>
      </div>
      <Suspense fallback={<div className="p-4 sm:p-6"><MonthlyDetailRecordsSkeleton /></div>}>
        <GroupMonthlyDetailData groupId={groupId} month={month} />
      </Suspense>
    </div>
  );
}
