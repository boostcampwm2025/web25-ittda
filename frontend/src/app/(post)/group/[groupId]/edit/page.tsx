import GroupEditClient from './_components/GroupEditClient';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { getCachedGroupDetail } from '@/lib/api/group';
import { redirect } from 'next/navigation';
import { createMockGroupSettings } from '@/lib/mocks/mock';
import { GroupEditResponse } from '@/lib/types/groupResponse';

interface GroupEditPageProps {
  params: Promise<{ groupId: string }>;
}

export default async function GroupEditPage({ params }: GroupEditPageProps) {
  const { groupId } = await params;
  const queryClient = new QueryClient();
  let groupProfile: GroupEditResponse;

  if (process.env.NEXT_PUBLIC_MOCK !== 'true') {
    try {
      groupProfile = await getCachedGroupDetail(groupId);
      // QueryClient에 직접 넣어서 HydrationBoundary로 클라이언트에 전달
      queryClient.setQueryData(['group', groupId, 'edit'], groupProfile);
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
    groupProfile = createMockGroupSettings(groupId);
    queryClient.setQueryData(
      ['group', groupId, 'edit'],
      createMockGroupSettings(groupId),
    );
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <GroupEditClient profile={groupProfile} groupId={groupId} />
    </HydrationBoundary>
  );
}
