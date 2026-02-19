import MonthlyDetailHeaderActions from '@/app/(post)/_components/MonthlyDetailHeaderActions';
import MonthlyDetailRecords from '@/app/(post)/_components/MonthlyDetailRecords';
import MonthlyDetailRecordsSkeleton from '@/app/(post)/_components/MonthlyDetailRecordsSkeleton';
import ErrorHandlingWrapper from '@/components/ErrorHandlingWrapper';
import ErrorFallback from '@/components/ErrorFallback';
import { getMonthRange } from '@/lib/date';
import { createMockDailyRecord } from '@/lib/mocks/mock';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { myDailyRecordListOptions } from '@/lib/api/my';

interface MyMonthlyDetailPageProps {
  params: Promise<{ month: string }>;
}

export default async function MyMonthlyDetailPage({
  params,
}: MyMonthlyDetailPageProps) {
  const { month } = await params;
  const queryClient = new QueryClient();

  if (process.env.NEXT_PUBLIC_MOCK === 'true') {
    queryClient.setQueryData(['my', 'records', 'daily', month], createMockDailyRecord());
  } else {
    await queryClient.prefetchQuery(myDailyRecordListOptions(month));
  }

  const { startDate, endDate } = getMonthRange(month);
  return (
    <div className="-mt-4 sm:-mt-6 h-full transition-colors duration-300 dark:bg-[#121212] bg-[#FDFDFD]">
      <div className="-mx-4 sm:-mx-6 py-3 px-4 sm:py-6 sm:px-6 sticky top-0 z-50 transition-colors duration-300 dark:bg-[#121212] bg-white">
        <header className="flex items-center justify-between">
          <MonthlyDetailHeaderActions month={month} title="Memory archive" />
        </header>
      </div>

      <div className="py-4 sm:py-6 pb-28 sm:pb-40">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <ErrorHandlingWrapper
            fallbackComponent={ErrorFallback}
            suspenseFallback={<MonthlyDetailRecordsSkeleton />}
          >
            <MonthlyDetailRecords
              month={month}
              routePath="/my/detail"
              viewMapRoutePath={`/map?start=${startDate}&end=${endDate}`}
            />
          </ErrorHandlingWrapper>
        </HydrationBoundary>
      </div>
    </div>
  );
}
