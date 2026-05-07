'use client';

import { GroupEditProvider } from '../../_components/GroupEditContext';
import GroupMemberManagement from '../../_components/GroupMemberManagement';
import Back from '@/components/Back';
import { groupDetailOptions } from '@/lib/api/group';
import { useSuspenseQuery } from '@tanstack/react-query';

interface GroupMembersClientProps {
  groupId: string;
}

export default function GroupMembersClient({ groupId }: GroupMembersClientProps) {
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
        <Back fallback={`/group/${groupId}`} />
        <h2 className="text-[13px] sm:text-sm font-bold dark:text-white text-itta-black">
          멤버 관리
        </h2>
        <div className="w-4" />
      </header>

      <div className="p-6 pb-10 flex-1 overflow-y-auto scrollbar-hide">
        <GroupMemberManagement groupId={groupId} me={me} />
      </div>
    </GroupEditProvider>
  );
}
