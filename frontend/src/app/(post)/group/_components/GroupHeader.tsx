import Image from 'next/image';
import GroupHeaderActions from './GroupHeaderActions';
import { Users } from 'lucide-react';
import { getCachedGroupCurrentMembers } from '@/lib/api/group';
import { GroupMembersResponse } from '@/lib/types/groupResponse';
import { createMockGroupMembers } from '@/lib/mocks/mock';
import AssetImage from '@/components/AssetImage';

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
    <header className="sticky top-0 z-50 w-full inset-x-0 pb-6 pt-4 transition-all duration-300 dark:bg-[#121212] bg-white">
      <GroupHeaderActions groupInfo={groupInfo} className={className} />

      <div className="flex items-end justify-between px-1">
        <div className="space-y-1 min-w-0 flex-1">
          <h2 className="text-xl font-bold tracking-tight dark:text-white text-itta-black truncate">
            {groupInfo.groupName}
          </h2>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-[#10B981]">
            <Users className="w-3.5 h-3.5" strokeWidth={1.5} />
            {groupInfo.members.length}명의 멤버 참여 중
          </div>
        </div>
        <div className="flex -space-x-2">
          {groupInfo.members
            ?.slice(0, 5)
            .map((m) =>
              m.profileImageId ? (
                <AssetImage
                  key={m.memberId}
                  width={32}
                  height={32}
                  assetId={m.profileImageId}
                  alt="멤버의 프로필"
                  className="w-8 h-8 rounded-full border-2 shadow-sm bg-white dark:border-[#121212] border-white object-cover"
                />
              ) : (
                <Image
                  key={m.memberId}
                  width={32}
                  height={32}
                  src={'/profile_base.png'}
                  alt="멤버의 프로필"
                  className="w-8 h-8 rounded-full border-2 shadow-sm bg-white dark:border-[#121212] border-white object-cover"
                />
              ),
            )}
          {groupInfo.members && groupInfo.members.length > 5 && (
            <div className="w-8 h-8 rounded-full border-2 shadow-sm bg-gray-100 dark:bg-gray-800 dark:border-[#121212] border-white flex items-center justify-center">
              <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300">
                +{groupInfo.members.length - 5}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
