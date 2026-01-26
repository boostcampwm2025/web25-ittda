import { getCachedGroupMyProfile } from '@/lib/api/group';
import GroupProfileEditClient from './_components/GroupProfileEditClient';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { GroupMemberProfileResponse } from '@/lib/types/groupResponse';
import { createMockGroupMyProfile } from '@/lib/mocks/mock';

export default async function GroupProfileEditPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const queryClient = new QueryClient();
  let profileData: GroupMemberProfileResponse;

  if (process.env.NEXT_PUBLIC_MOCK !== 'true') {
    profileData = await getCachedGroupMyProfile(groupId);
  } else {
    profileData = createMockGroupMyProfile(groupId);
  }

  const groupProfile = {
    id: profileData.userId,
    nickname: profileData.nicknameInGroup,
    profileImageId: profileData.cover?.assetId || '', // TODO: 이미지 추후 별도 로직 추가
  };

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <GroupProfileEditClient groupId={groupId} groupProfile={groupProfile} />
    </HydrationBoundary>
  );
}
