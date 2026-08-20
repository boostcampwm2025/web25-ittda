import { Users, User, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecordScopeBadgesProps {
  isGroup: boolean;
  groupName?: string | null;
  isSharedPost?: boolean;
  sharedGroups?: { groupId: string; groupName: string }[];
}

function Badge({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold',
        className,
      )}
    >
      {children}
    </div>
  );
}

// 기록 카드(RecordItem)와 상세 화면(RecordDetail)에서 공통으로 쓰는
// 개인/그룹/그룹명/공유됨 뱃지. 그룹 글이 공유된 경우(단일 그룹 기준)와,
// 개인 글이 여러 그룹에 공유된 경우(그룹별 뱃지)를 모두 표현한다.
export default function RecordScopeBadges({
  isGroup,
  groupName,
  isSharedPost,
  sharedGroups,
}: RecordScopeBadgesProps) {
  if (isGroup) {
    return (
      <>
        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          <span>그룹</span>
        </Badge>

        {groupName && (
          <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
            <span className="truncate max-w-15 sm:max-w-17.5 inline-block align-bottom">
              {groupName}
            </span>
          </Badge>
        )}

        {isSharedPost && (
          <Badge className="bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
            <Share2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span>공유됨</span>
          </Badge>
        )}
      </>
    );
  }

  return (
    <>
      <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
        <User className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
        <span>개인</span>
      </Badge>

      {sharedGroups?.map((group) => (
        <Badge
          key={group.groupId}
          className="bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
        >
          <Share2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          <span className="truncate max-w-15 sm:max-w-17.5 inline-block align-bottom">
            {group.groupName}
          </span>
        </Badge>
      ))}
    </>
  );
}
