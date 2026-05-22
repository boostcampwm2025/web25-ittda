import MonthRecords from '@/app/(post)/_components/MonthRecords';
import MonthRecordsSkeleton from '@/app/(post)/_components/MonthRecordsSkeleton';
import ErrorHandlingWrapper from '@/components/ErrorHandlingWrapper';
import ErrorFallback from '@/components/ErrorFallback';
import { createMockMonthlyRecord } from '@/lib/mocks/mock';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { myMonthlyRecordListOptions } from '@/lib/api/my';

export default async function MyRecordsPage() {
  const queryClient = new QueryClient();
  const year = String(new Date().getFullYear());

  if (process.env.NEXT_PUBLIC_MOCK === 'true') {
    queryClient.setQueryData(
      ['my', 'records', 'month', year],
      createMockMonthlyRecord(),
    );
  } else {
    await queryClient.prefetchQuery(myMonthlyRecordListOptions(year));
  }

  return (
    <>
      <div className="flex items-baseline gap-2">
        <span className="text-sm sm:text-base font-bold dark:text-white text-[#222]">
          {year}년
        </span>
        <span className="text-xs text-gray-400">이번 해의 월별 기록이에요</span>
      </div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ErrorHandlingWrapper
          fallbackComponent={ErrorFallback}
          suspenseFallback={<MonthRecordsSkeleton />}
        >
          <MonthRecords cardRoute={'/my/month'} />
        </ErrorHandlingWrapper>
      </HydrationBoundary>
    </>
  );
}
