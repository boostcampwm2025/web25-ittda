import MonthlyDetailHeaderActions from '@/app/(post)/_components/MonthlyDetailHeaderActions';
import MonthlyDetailRecordsSkeleton from '@/app/(post)/_components/MonthlyDetailRecordsSkeleton';
import { Suspense } from 'react';
import MyMonthlyDetailData from './_components/MyMonthlyDetailData';

interface MyMonthlyDetailPageProps {
  params: Promise<{ month: string }>;
}

export default async function MyMonthlyDetailPage({
  params,
}: MyMonthlyDetailPageProps) {
  const { month } = await params;

  return (
    <div className="-mt-4 sm:-mt-6 h-full transition-colors duration-300 dark:bg-[#121212] bg-[#FDFDFD]">
      <div className="-mx-4 sm:-mx-6 py-3 px-4 sm:py-6 sm:px-6 sticky top-0 z-50 transition-colors duration-300 dark:bg-[#121212] bg-white">
        <header className="flex items-center justify-between">
          <MonthlyDetailHeaderActions month={month} title="Memory archive" />
        </header>
      </div>
      <Suspense fallback={<div className="py-4 sm:py-6"><MonthlyDetailRecordsSkeleton /></div>}>
        <MyMonthlyDetailData month={month} />
      </Suspense>
    </div>
  );
}
