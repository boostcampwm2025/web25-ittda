import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { pastFeedInfiniteOptions } from '@/lib/api/records';
import { userRecordPatternOptions } from '@/lib/api/profile';
import ErrorHandlingWrapper from '@/components/ErrorHandlingWrapper';
import ErrorFallback from '@/components/ErrorFallback';
import HomePageSkeleton from './HomePageSkeleton';
import RecordTimelineFeed from './RecordTimelineFeed';

export default async function HomeData() {
  const queryClient = new QueryClient();

  if (process.env.NEXT_PUBLIC_MOCK === 'true') {
    queryClient.setQueryData(pastFeedInfiniteOptions().queryKey, {
      pages: [{ items: [], nextCursor: null }],
      pageParams: [null],
    });
    queryClient.setQueryData(userRecordPatternOptions().queryKey, {
      streak: 0,
      monthlyRecordingDays: 0,
    });
  } else {
    await Promise.all([
      queryClient.prefetchInfiniteQuery(pastFeedInfiniteOptions()),
      queryClient.prefetchQuery(userRecordPatternOptions()),
    ]);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ErrorHandlingWrapper
        fallbackComponent={ErrorFallback}
        suspenseFallback={<HomePageSkeleton />}
      >
        <div className="w-full px-5 space-y-6 pt-7 pb-bottom-nav transition-colors duration-300 dark:bg-[#121212] bg-[#F9F9F9]">
          <div className="w-full flex flex-col gap-6">
            <RecordTimelineFeed imageLayout="responsive" />
          </div>
        </div>
      </ErrorHandlingWrapper>
    </HydrationBoundary>
  );
}
