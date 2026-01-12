import GroupProfileEditClient from './_components/GroupProfileEditClient';

// TODO: 서버에서 그룹 프로필 데이터 가져오기
const getGroupProfile = async (groupId: string) => {
  return {
    nickname: '도비',
    image: '/profile-ex.jpeg',
  };
};

export default async function GroupProfileEditPage({
  params,
}: {
  params: { groupId: string };
}) {
  const groupProfile = await getGroupProfile(params.groupId);

  return (
    <GroupProfileEditClient
      groupId={params.groupId}
      groupProfile={groupProfile}
    />
  );
}
