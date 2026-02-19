import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import {
  userProfileOptions,
  userProfileTagSummaryOptions,
} from '@/lib/api/profile';
import ProfileAllTagsHeaderActions from './_components/ProfileAllTagsHeaderActions';
import AllTagsContent from './_components/AllTagsContent';
import AllTagsSkeleton from './_components/AllTagsSkeleton';
import ErrorHandlingWrapper from '@/components/ErrorHandlingWrapper';
import ErrorFallback from '@/components/ErrorFallback';

export default async function ProfileAllTagsPage() {
  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery(userProfileOptions()),
    queryClient.prefetchQuery(userProfileTagSummaryOptions()),
  ]);

  return (
    <div className="w-full pb-20 flex flex-col min-h-screen dark:bg-[#121212] dark:text-white bg-white text-itta-black">
      <ProfileAllTagsHeaderActions />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ErrorHandlingWrapper
          fallbackComponent={ErrorFallback}
          suspenseFallback={<AllTagsSkeleton />}
        >
          <AllTagsContent />
        </ErrorHandlingWrapper>
      </HydrationBoundary>
    </div>
  );
}
