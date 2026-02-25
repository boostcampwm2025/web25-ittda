import DailyDetailRecords from '@/components/DailyDetailRecords';
import DailyDetailRecordsSkeleton from '@/components/DailyDetailRecordsSkeleton';
import DailyDetailFloatingActions from '@/app/(post)/_components/DailyDetailFloatingActions';
import ErrorHandlingWrapper from '@/components/ErrorHandlingWrapper';
import ErrorFallback from '@/components/ErrorFallback';
import { createMockRecordPreviews } from '@/lib/mocks/mock';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { recordPreviewListOptions } from '@/lib/api/records';

interface MyDailyDetailDataProps {
  date: string;
}

export default async function MyDailyDetailData({ date }: MyDailyDetailDataProps) {
  const queryClient = new QueryClient();

  if (process.env.NEXT_PUBLIC_MOCK === 'true') {
    queryClient.setQueryData(
      ['records', 'preview', date, 'personal'],
      createMockRecordPreviews(date),
    );
  } else {
    await queryClient.prefetchQuery(recordPreviewListOptions(date, 'personal'));
  }

  return (
    <div className="py-4 sm:py-6 pb-14 sm:pb-16">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ErrorHandlingWrapper
          fallbackComponent={ErrorFallback}
          suspenseFallback={<DailyDetailRecordsSkeleton />}
        >
          <DailyDetailRecords date={date} scope="personal" />
        </ErrorHandlingWrapper>
      </HydrationBoundary>
      <DailyDetailFloatingActions date={date} />
    </div>
  );
}
