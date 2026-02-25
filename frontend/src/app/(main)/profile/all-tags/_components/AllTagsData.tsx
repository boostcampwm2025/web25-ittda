import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { userProfileOptions, userProfileTagSummaryOptions } from '@/lib/api/profile';
import AllTagsContent from './AllTagsContent';
import AllTagsSkeleton from './AllTagsSkeleton';
import ErrorHandlingWrapper from '@/components/ErrorHandlingWrapper';
import ErrorFallback from '@/components/ErrorFallback';

export default async function AllTagsData() {
  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery(userProfileOptions()),
    queryClient.prefetchQuery(userProfileTagSummaryOptions()),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ErrorHandlingWrapper
        fallbackComponent={ErrorFallback}
        suspenseFallback={<AllTagsSkeleton />}
      >
        <AllTagsContent />
      </ErrorHandlingWrapper>
    </HydrationBoundary>
  );
}
