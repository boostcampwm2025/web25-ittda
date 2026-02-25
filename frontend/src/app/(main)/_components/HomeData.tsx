import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { recordPreviewListOptions } from '@/lib/api/records';
import { userRecordPatternOptions } from '@/lib/api/profile';
import { formatDateISO } from '@/lib/date';
import ErrorHandlingWrapper from '@/components/ErrorHandlingWrapper';
import ErrorFallback from '@/components/ErrorFallback';
import HomePageSkeleton from './HomePageSkeleton';
import StreakStats from './StreakStats';
import RecordList from './RecordList';

export default async function HomeData() {
  const queryClient = new QueryClient();
  const today = formatDateISO();

  if (process.env.NEXT_PUBLIC_MOCK === 'true') {
    queryClient.setQueryData(recordPreviewListOptions(today).queryKey, []);
    queryClient.setQueryData(userRecordPatternOptions().queryKey, {
      streak: 0,
      monthlyRecordingDays: 0,
    });
  } else {
    await Promise.all([
      queryClient.prefetchQuery(recordPreviewListOptions(today)),
      queryClient.prefetchQuery(userRecordPatternOptions()),
    ]);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ErrorHandlingWrapper
        fallbackComponent={ErrorFallback}
        suspenseFallback={<HomePageSkeleton />}
      >
        <StreakStats />
        <div className="flex-1 w-full overflow-y-auto scrollbar-hide px-5 space-y-6 pt-7 pb-bottom-nav transition-colors duration-300 dark:bg-[#121212] bg-[#F9F9F9]">
          <div className="w-full flex flex-col gap-6">
            <RecordList imageLayout="responsive" />
          </div>
        </div>
      </ErrorHandlingWrapper>
    </HydrationBoundary>
  );
}
