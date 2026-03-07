import MonthlyDetailRecords from '@/app/(post)/_components/MonthlyDetailRecords';
import MonthlyDetailRecordsSkeleton from '@/app/(post)/_components/MonthlyDetailRecordsSkeleton';
import ErrorHandlingWrapper from '@/components/ErrorHandlingWrapper';
import ErrorFallback from '@/components/ErrorFallback';
import { getMonthRange } from '@/lib/date';
import { createMockDailyRecord } from '@/lib/mocks/mock';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { myDailyRecordListOptions } from '@/lib/api/my';

interface MyMonthlyDetailDataProps {
  month: string;
}

export default async function MyMonthlyDetailData({ month }: MyMonthlyDetailDataProps) {
  const queryClient = new QueryClient();

  if (process.env.NEXT_PUBLIC_MOCK === 'true') {
    queryClient.setQueryData(['my', 'records', 'daily', month], createMockDailyRecord());
  } else {
    await queryClient.prefetchQuery(myDailyRecordListOptions(month));
  }

  const { startDate, endDate } = getMonthRange(month);

  return (
    <div className="py-4 sm:py-6 pb-bottom-nav">
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
  );
}
