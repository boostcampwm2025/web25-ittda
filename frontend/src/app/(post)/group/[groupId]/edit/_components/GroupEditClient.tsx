'use client';

import { GroupEditProvider } from './GroupEditContext';
import GroupInfo from './GroupInfo';
import GroupMemberManagement from './GroupMemberManagement';
import GroupDangerousZone from './GroupDangerousZone';
import GroupEditHeaderActions from './GroupEditHeaderActions';
import { groupDetailOptions } from '@/lib/api/group';
import { useSuspenseQuery } from '@tanstack/react-query';

interface GroupEditClientProps {
  groupId: string;
}

export default function GroupEditClient({ groupId }: GroupEditClientProps) {
  const { data } = useSuspenseQuery(groupDetailOptions(groupId));

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
      <header className="sticky top-0 z-50 backdrop-blur-md px-4 py-3 sm:p-6 flex items-center justify-between transition-colors duration-300 dark:bg-[#121212]/95 bg-white/95">
        <GroupEditHeaderActions groupId={groupId} me={me} />
      </header>

      <div className="p-6 pb-10 flex-1 space-y-10 overflow-y-auto hide-scrollbar">
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
