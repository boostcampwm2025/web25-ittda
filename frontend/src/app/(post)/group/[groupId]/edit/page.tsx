import { Group } from '@/lib/types/group';
import GroupEditClient from '../../_components/GroupEditClient';

interface GroupEditPageProps {
  params: Promise<{ groupId: string }>;
}

const groupInfo: Group = {
  groupName: '우리 가족 추억함',
  groupThumnail: '/profile-ex.jpeg',
  members: [
    {
      id: 1,
      name: '나',
      avatar: '/profile-ex.jpeg',
      role: 'admin',
    },
    {
      id: 2,
      name: '엄마',
      avatar: '/profile-ex.jpeg',
      role: 'member',
    },
    {
      id: 3,
      name: '아빠',
      avatar: '/profile-ex.jpeg',
      role: 'member',
    },
    {
      id: 4,
      name: '동생',
      avatar: '/profile-ex.jpeg',
      role: 'member',
    },
  ],
};

export default async function GroupEditPage({ params }: GroupEditPageProps) {
  const { groupId } = await params;

  // TODO: 서버에서 그룹 정보를 가져오는 로직 추가
  // const groupInfo = await fetchGroupInfo(groupId);

  return <GroupEditClient groupId={groupId} groupInfo={groupInfo} />;
}
