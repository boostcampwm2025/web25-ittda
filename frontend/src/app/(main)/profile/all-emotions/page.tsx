import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import {
  userProfileOptions,
  userProfileEmotionSummaryOptions,
} from '@/lib/api/profile';
import ProfileAllEmotionsHeaderActions from './_components/ProfileAllEmotionsHeaderActions';
import AllEmotionsContent from './_components/AllEmotionsContent';
import AllEmotionsSkeleton from './_components/AllEmotionsSkeleton';
import ErrorHandlingWrapper from '@/components/ErrorHandlingWrapper';
import ErrorFallback from '@/components/ErrorFallback';

export default async function ProfileAllEmotionsPage() {
  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery(userProfileOptions()),
    queryClient.prefetchQuery(userProfileEmotionSummaryOptions()),
  ]);

  return (
    <div className="w-full pb-20 flex flex-col min-h-screen dark:bg-[#121212] dark:text-white bg-white text-itta-black">
      <ProfileAllEmotionsHeaderActions />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ErrorHandlingWrapper
          fallbackComponent={ErrorFallback}
          suspenseFallback={<AllEmotionsSkeleton />}
        >
          <AllEmotionsContent />
        </ErrorHandlingWrapper>
      </HydrationBoundary>
    </div>
  );
}
