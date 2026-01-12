'use client';

import { Group } from '@/lib/types/group';
import { GroupEditProvider } from './GroupEditContext';
import GroupInfo from './GroupInfo';
import GroupMemberManagement from './GroupMemberManagement';
import GroupDangerousZone from './GroupDangerousZone';
import GroupEditHeaderActions from './GroupEditHeaderActions';

interface GroupEditClientProps {
  groupId: string;
  groupInfo: Group;
}

export default function GroupEditClient({
  groupId,
  groupInfo,
}: GroupEditClientProps) {
  return (
    <GroupEditProvider
      initialName={groupInfo.groupName}
      initialThumbnail={groupInfo.groupThumnail}
      initialMembers={groupInfo.members}
    >
      <header className="sticky top-0 z-50 backdrop-blur-md p-6 flex items-center justify-between border-b transition-colors duration-300 dark:bg-[#121212]/95 dark:border-white/5 bg-white/95 border-gray-50">
        <GroupEditHeaderActions groupId={groupId} />
      </header>

      <div className="-mb-20 p-6 flex-1 pb-0 space-y-10 overflow-y-auto hide-scrollbar">
        <GroupInfo
          groupThumnail={groupInfo.groupThumnail}
          groupId={groupId}
          nickname={groupInfo.nicknameInGroup}
        />

        <GroupMemberManagement members={groupInfo.members} />

        <GroupDangerousZone groupName={groupInfo.groupName} />
      </div>
    </GroupEditProvider>
  );
}
