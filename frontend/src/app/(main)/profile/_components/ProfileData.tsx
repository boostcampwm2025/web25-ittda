import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { userProfileOptions, userProfileTagSummaryOptions } from '@/lib/api/profile';
import { createMockTagStats } from '@/lib/mocks/mock';
import ErrorHandlingWrapper from '@/components/ErrorHandlingWrapper';
import ErrorFallback from '@/components/ErrorFallback';
import ProfilePageSkeleton from './ProfilePageSkeleton';
import Profile from './Profile';
import TagDashboard from './TagDashboard';
import RecordStatistics from './RecordStatistics';
import Setting from './Setting';

export default async function ProfileData() {
  const queryClient = new QueryClient();

  if (process.env.NEXT_PUBLIC_MOCK === 'true') {
    queryClient.setQueryData(userProfileTagSummaryOptions(10).queryKey, createMockTagStats());
  } else {
    await Promise.all([
      queryClient.prefetchQuery(userProfileOptions()),
      queryClient.prefetchQuery(userProfileTagSummaryOptions(10)),
    ]);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ErrorHandlingWrapper
        fallbackComponent={ErrorFallback}
        suspenseFallback={<ProfilePageSkeleton />}
      >
        <Profile />
        <TagDashboard />
        <RecordStatistics />
      </ErrorHandlingWrapper>
      <Setting />
    </HydrationBoundary>
  );
}
