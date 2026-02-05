'use client';

import { GroupEditProvider } from './GroupEditContext';
import GroupInfo from './GroupInfo';
import GroupMemberManagement from './GroupMemberManagement';
import GroupDangerousZone from './GroupDangerousZone';
import GroupEditHeaderActions from './GroupEditHeaderActions';
import { groupDetailOptions } from '@/lib/api/group';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { GroupEditResponse } from '@/lib/types/groupResponse';

interface GroupEditClientProps {
  groupId: string;
  profile: GroupEditResponse;
}

export default function GroupEditClient({
  groupId,
  profile,
}: GroupEditClientProps) {
  const router = useRouter();
  const { data } = useQuery({
    ...groupDetailOptions(groupId),
    initialData: profile,
  });

  if (!data) {
    router.push(`/group/${groupId}`);
    return;
  }

  const { group, me, members } = data;
  return (
    <GroupEditProvider
      initialName={group.name}
      initialThumbnail={{
        assetId: group.cover?.assetId || '',
        postId: group.cover?.sourcePostId || '',
      }}
      initialMembers={members}
    >
      <header className="sticky top-0 z-50 backdrop-blur-md p-6 flex items-center justify-between transition-colors duration-300 dark:bg-[#121212]/95 bg-white/95">
        <GroupEditHeaderActions groupId={groupId} me={me} />
      </header>

      <div className="-mb-20 p-6 flex-1 pb-0 space-y-10 overflow-y-auto hide-scrollbar">
        <GroupInfo
          groupThumnail={group.cover?.assetId || ''}
          groupId={groupId}
          me={me}
        />

        <GroupMemberManagement groupId={groupId} me={me} />

        <GroupDangerousZone groupName={group.name} me={me} groupId={groupId} />
      </div>
    </GroupEditProvider>
  );
}
