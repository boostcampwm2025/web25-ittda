import GroupMembersClient from './_components/GroupMembersClient';
import GroupMembersSkeleton from './_components/GroupMembersSkeleton';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { getCachedGroupDetail, groupDetailOptions } from '@/lib/api/group';
import { redirect } from 'next/navigation';
import { createMockGroupSettings } from '@/lib/mocks/mock';
import ErrorHandlingWrapper from '@/components/ErrorHandlingWrapper';
import ErrorFallback from '@/components/ErrorFallback';

export default async function GroupMembersPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const queryClient = new QueryClient();

  if (process.env.NEXT_PUBLIC_MOCK !== 'true') {
    try {
      const groupProfile = await getCachedGroupDetail(groupId);

      if (groupProfile.me.role !== 'ADMIN') {
        redirect(`/group/${groupId}/edit`);
      }

      queryClient.setQueryData(groupDetailOptions(groupId).queryKey, groupProfile);
    } catch (error: unknown) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? (error as { code: string }).code
          : undefined;

      if (code === 'NOT_FOUND') redirect('/shared');
      if (code === 'FORBIDDEN') redirect(`/group/${groupId}`);
      throw error;
    }
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
        suspenseFallback={<GroupMembersSkeleton />}
      >
        <GroupMembersClient groupId={groupId} />
      </ErrorHandlingWrapper>
    </HydrationBoundary>
  );
}
