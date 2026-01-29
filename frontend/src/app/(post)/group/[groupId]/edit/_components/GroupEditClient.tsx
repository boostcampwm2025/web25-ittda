'use client';

import { GroupEditProvider } from './GroupEditContext';
import GroupInfo from './GroupInfo';
import GroupMemberManagement from './GroupMemberManagement';
import GroupDangerousZone from './GroupDangerousZone';
import GroupEditHeaderActions from './GroupEditHeaderActions';
import { groupDetailOptions } from '@/lib/api/group';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

interface GroupEditClientProps {
  groupId: string;
}

export default function GroupEditClient({ groupId }: GroupEditClientProps) {
  const router = useRouter();
  const { data } = useQuery(groupDetailOptions(groupId));

  if (!data) {
    router.push(`/group/${groupId}`);
    return;
  }

  const { group, me, members } = data;
  return (
    <GroupEditProvider
      initialName={group.name}
      initialThumbnail={group.cover?.assetId || ''}
      initialMembers={members}
    >
      <header className="sticky top-0 z-50 backdrop-blur-md p-6 flex items-center justify-between transition-colors duration-300 dark:bg-[#121212]/95 bg-white/95">
        <GroupEditHeaderActions groupId={groupId} />
      </header>

      <div className="-mb-20 p-6 flex-1 pb-0 space-y-10 overflow-y-auto hide-scrollbar">
        <GroupInfo
          groupThumnail={group.cover?.assetId || ''}
          groupId={groupId}
          me={me}
        />

        <GroupMemberManagement groupId={groupId} />

        <GroupDangerousZone groupName={group.name} groupId={groupId} />
      </div>
    </GroupEditProvider>
  );
}
