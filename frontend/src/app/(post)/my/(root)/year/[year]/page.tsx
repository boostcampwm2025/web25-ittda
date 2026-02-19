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

interface MyYearRecordsPageProps {
  params: Promise<{ year: string }>;
}

export default async function MyYearRecordsPage({
  params,
}: MyYearRecordsPageProps) {
  const { year } = await params;
  const queryClient = new QueryClient();

  if (process.env.NEXT_PUBLIC_MOCK === 'true') {
    queryClient.setQueryData(['my', 'records', 'month', year], createMockMonthlyRecord());
  } else {
    await queryClient.prefetchQuery(myMonthlyRecordListOptions(year));
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ErrorHandlingWrapper
        fallbackComponent={ErrorFallback}
        suspenseFallback={<MonthRecordsSkeleton />}
      >
        <MonthRecords cardRoute={'/my/month'} />
      </ErrorHandlingWrapper>
    </HydrationBoundary>
  );
}
