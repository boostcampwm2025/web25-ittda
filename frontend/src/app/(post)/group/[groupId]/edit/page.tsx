import GroupEditClient from './_components/GroupEditClient';
import GroupEditSkeleton from './_components/GroupEditSkeleton';
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

interface GroupEditPageProps {
  params: Promise<{ groupId: string }>;
}

export default async function GroupEditPage({ params }: GroupEditPageProps) {
  const { groupId } = await params;
  const queryClient = new QueryClient();

  if (process.env.NEXT_PUBLIC_MOCK !== 'true') {
    try {
      const groupProfile = await getCachedGroupDetail(groupId);
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
        suspenseFallback={<GroupEditSkeleton />}
      >
        <GroupEditClient groupId={groupId} />
      </ErrorHandlingWrapper>
    </HydrationBoundary>
  );
}
