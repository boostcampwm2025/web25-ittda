import Back from '@/components/Back';
import DailyDetailRecordsSkeleton from '@/components/DailyDetailRecordsSkeleton';
import { Suspense } from 'react';
import MyDailyDetailData from './_components/MyDailyDetailData';

interface MyMonthlyDetailPageProps {
  params: Promise<{ date: string }>;
}

export default async function MyDateDetailPage({
  params,
}: MyMonthlyDetailPageProps) {
  const { date } = await params;

  return (
    <div className="-mt-4 sm:-mt-6 h-full transition-colors duration-300 dark:bg-[#121212] bg-[#FDFDFD]">
      <header className="-mx-4 sm:-mx-6 sticky top-0 z-50 backdrop-blur-md px-4 py-3 sm:p-6 flex items-center justify-between transition-colors duration-300 dark:bg-[#121212]/80 bg-white/80">
        <Back fallback={`/my/month/${date.slice(0, 7)}`} />
        <div className="flex flex-col items-center">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest leading-none mb-1 text-[#10B981]">
            RECORD OF
          </span>
          <span className="text-xs sm:text-sm font-bold dark:text-white text-itta-black">
            {date}
          </span>
        </div>
        <div className="w-6 sm:w-8" />
      </header>
      <Suspense
        fallback={
          <div className="py-4 sm:py-6">
            <DailyDetailRecordsSkeleton />
          </div>
        }
      >
        <MyDailyDetailData date={date} />
      </Suspense>
    </div>
  );
}
