import { groupMyProfileOptions } from '@/lib/api/group';
import GroupProfileEditClient from './_components/GroupProfileEditClient';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';

export default async function GroupProfileEditPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const queryClient = new QueryClient();

  // 서버에서 프리패칭 수행
  const profileData = await queryClient.fetchQuery(
    groupMyProfileOptions(groupId),
  );
  const groupProfile = {
    id: profileData.userId,
    nickname: profileData.nicknameInGroup,
    profileImageUrl: profileData.cover?.assetId || '', // TODO: 이미지 추후 별도 로직 추가
  };

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <GroupProfileEditClient groupId={groupId} groupProfile={groupProfile} />
    </HydrationBoundary>
  );
}
