import GroupProfileEditClient from './_components/GroupProfileEditClient';
import GroupProfileEditSkeleton from './_components/GroupProfileEditSkeleton';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { groupDetailOptions } from '@/lib/api/group';
import { createMockGroupSettings } from '@/lib/mocks/mock';
import ErrorHandlingWrapper from '@/components/ErrorHandlingWrapper';
import ErrorFallback from '@/components/ErrorFallback';

export default async function GroupProfileEditPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const queryClient = new QueryClient();

  if (process.env.NEXT_PUBLIC_MOCK !== 'true') {
    await queryClient.prefetchQuery(groupDetailOptions(groupId));
  } else {
    queryClient.setQueryData(
      groupDetailOptions(groupId).queryKey,
      createMockGroupSettings(groupId),
    );
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ErrorHandlingWrapper
        fallbackComponent={ErrorFallback}
        suspenseFallback={<GroupProfileEditSkeleton />}
      >
        <GroupProfileEditClient groupId={groupId} />
      </ErrorHandlingWrapper>
    </HydrationBoundary>
  );
}
