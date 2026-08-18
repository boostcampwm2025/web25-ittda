import GroupHeaderActions from './GroupHeaderActions';
import { getCachedGroupCurrentMembers } from '@/lib/api/group';
import { GroupMembersResponse } from '@/lib/types/groupResponse';
import { createMockGroupMembers } from '@/lib/mocks/mock';
import RetryFallback from '@/components/RetryFallback';

export default async function GroupHeader({
  className,
  groupId,
}: {
  className?: string;
  groupId: string;
}) {
  let groupInfo: GroupMembersResponse | null = null;

  if (process.env.NEXT_PUBLIC_MOCK === 'true') {
    groupInfo = createMockGroupMembers();
  } else {
    try {
      groupInfo = await getCachedGroupCurrentMembers(groupId);
    } catch {
      // 멤버 정보 로드 실패 시 헤더 영역만 축소 렌더링
    }
  }

  return (
    <header
      id="group-header-sticky"
      data-stacked-header
      className="sticky top-0 pt-3 z-50 -mx-4 sm:-mx-6 px-4 sm:px-6 pb-2 transition-all duration-300 dark:bg-[#121212] bg-white"
    >
      {groupInfo ? (
        <GroupHeaderActions groupInfo={groupInfo} className={className} />
      ) : (
        <RetryFallback fallback="/shared" className="mb-3" />
      )}
    </header>
  );
}
