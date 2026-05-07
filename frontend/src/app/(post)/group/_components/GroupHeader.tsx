import GroupHeaderActions from './GroupHeaderActions';
import { getCachedGroupCurrentMembers } from '@/lib/api/group';
import { GroupMembersResponse } from '@/lib/types/groupResponse';
import { createMockGroupMembers } from '@/lib/mocks/mock';

export default async function GroupHeader({
  className,
  groupId,
}: {
  className?: string;
  groupId: string;
}) {
  let groupInfo: GroupMembersResponse;

  if (process.env.NEXT_PUBLIC_MOCK === 'true') {
    groupInfo = createMockGroupMembers();
  } else {
    groupInfo = await getCachedGroupCurrentMembers(groupId);
  }

  return (
    <header className="sticky top-0 pt-3 z-50 w-full inset-x-0 pb-2 transition-all duration-300 dark:bg-[#121212] bg-white">
      <GroupHeaderActions groupInfo={groupInfo} className={className} />
    </header>
  );
}
