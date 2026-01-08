'use client';

import { Group } from '@/lib/types/group';
import { GroupEditProvider } from './GroupEditContext';
import GroupEditHeaderActions from './GroupEditHeaderActions';
import GroupInfo from './GroupInfo';
import GroupMemberManagement from './GroupMemberManagement';
import GroupDangerousZone from './GroupDangerousZone';

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
      <header className="sticky top-0 z-50 backdrop-blur-md px-5 py-4 flex items-center justify-between border-b transition-colors duration-300 dark:bg-[#121212]/95 dark:border-white/5 bg-white/95 border-gray-50">
        <GroupEditHeaderActions groupId={groupId} />
      </header>

      <div className="-mb-20 flex-1 p-6 pb-0 space-y-10 overflow-y-auto hide-scrollbar">
        <GroupInfo groupThumnail={groupInfo.groupThumnail} />

        <GroupMemberManagement members={groupInfo.members} />

        <GroupDangerousZone groupName={groupInfo.groupName} />
      </div>
    </GroupEditProvider>
  );
}
