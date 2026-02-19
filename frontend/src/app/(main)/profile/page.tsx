import Profile from './_components/Profile';
import ProfileHeaderActions from './_components/ProfileHeaderActions';
import TagDashboard from './_components/TagDashboard';
import Setting from './_components/Setting';
import RecordStatistics from './_components/RecordStatistics';
import { createMockTagStats } from '@/lib/mocks/mock';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import ErrorHandlingWrapper from '@/components/ErrorHandlingWrapper';
import ErrorFallback from '@/components/ErrorFallback';
import ProfilePageSkeleton from './_components/ProfilePageSkeleton';
import { userProfileOptions, userProfileTagSummaryOptions } from '@/lib/api/profile';

export default async function ProfilePage() {
  const queryClient = new QueryClient();

  if (process.env.NEXT_PUBLIC_MOCK === 'true') {
    queryClient.setQueryData(
      userProfileTagSummaryOptions(10).queryKey,
      createMockTagStats(),
    );
  } else {
    await Promise.all([
      queryClient.prefetchQuery(userProfileOptions()),
      queryClient.prefetchQuery(userProfileTagSummaryOptions(10)),
    ]);
  }

  return (
    <div className="w-full flex flex-col min-h-screen pb-25 dark:bg-[#121212] bg-[#F9F9F9]">
      <ProfileHeaderActions />
      <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
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
      </div>
    </div>
  );
}
