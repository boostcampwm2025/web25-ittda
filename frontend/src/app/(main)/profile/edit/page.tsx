import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { userProfileOptions } from '@/lib/api/profile';
import ProfileEditClient from './_components/ProfileEditClient';
import ProfileEditSkeleton from './_components/ProfileEditSkeleton';
import ErrorHandlingWrapper from '@/components/ErrorHandlingWrapper';
import ErrorFallback from '@/components/ErrorFallback';

export default async function ProfileEditPage() {
  const queryClient = new QueryClient();

  if (process.env.NEXT_PUBLIC_MOCK !== 'true') {
    await queryClient.prefetchQuery(userProfileOptions());
  }

  return (
    <div className="w-full flex flex-col min-h-screen dark:bg-[#121212] dark:text-white bg-white text-itta-black">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ErrorHandlingWrapper
          fallbackComponent={ErrorFallback}
          suspenseFallback={<ProfileEditSkeleton />}
        >
          <ProfileEditClient />
        </ErrorHandlingWrapper>
      </HydrationBoundary>
    </div>
  );
}
