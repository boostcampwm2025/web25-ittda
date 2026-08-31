import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { userProfileOptions, userProfileEmotionSummaryOptions } from '@/lib/api/profile';
import AllEmotionsContent from './AllEmotionsContent';
import AllEmotionsSkeleton from './AllEmotionsSkeleton';
import ErrorHandlingWrapper from '@/components/ErrorHandlingWrapper';
import ErrorFallback from '@/components/ErrorFallback';

export default async function AllEmotionsData() {
  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery(userProfileOptions()),
    queryClient.prefetchQuery(userProfileEmotionSummaryOptions()),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ErrorHandlingWrapper
        fallbackComponent={ErrorFallback}
        suspenseFallback={<AllEmotionsSkeleton />}
      >
        <AllEmotionsContent />
      </ErrorHandlingWrapper>
    </HydrationBoundary>
  );
}
