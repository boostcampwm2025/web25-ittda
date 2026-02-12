'use client';

import { GroupActivityItem } from '@/lib/types/group';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import AssetImage from '@/components/AssetImage';
import Image from 'next/image';
import {
  FileText,
  Edit,
  UserPlus,
  UserMinus,
  PenTool,
  LucideIcon,
} from 'lucide-react';

interface ActivityItemProps {
  activity: GroupActivityItem;
  groupId: string;
}

export function ActivityItem({ activity, groupId }: ActivityItemProps) {
  const router = useRouter();

  const getActivityTypeInfo = (): {
    icon: LucideIcon;
    bgColor: string;
    iconColor: string;
  } => {
    switch (activity.type) {
      case 'POST_COLLAB_START':
        return {
          icon: PenTool,
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          iconColor: 'text-blue-600 dark:text-blue-400',
        };
      case 'POST_COLLAB_COMPLETE':
        return {
          icon: FileText,
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          iconColor: 'text-green-600 dark:text-green-400',
        };
      case 'POST_EDIT_START':
        return {
          icon: Edit,
          bgColor: 'bg-orange-100 dark:bg-orange-900/30',
          iconColor: 'text-orange-600 dark:text-orange-400',
        };
      case 'POST_EDIT_COMPLETE':
        return {
          icon: Edit,
          bgColor: 'bg-orange-100 dark:bg-orange-900/30',
          iconColor: 'text-orange-600 dark:text-orange-400',
        };
      case 'MEMBER_JOIN':
        return {
          icon: UserPlus,
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          iconColor: 'text-blue-600 dark:text-blue-400',
        };
      case 'MEMBER_LEAVE':
        return {
          icon: UserMinus,
          bgColor: 'bg-gray-100 dark:bg-gray-700/30',
          iconColor: 'text-gray-600 dark:text-gray-400',
        };
      default:
        return {
          icon: FileText,
          bgColor: 'bg-gray-100 dark:bg-gray-700/30',
          iconColor: 'text-gray-600 dark:text-gray-400',
        };
    }
  };

  const getActivityMessage = () => {
    const actorNames = activity.actors
      .map((actor) => actor.groupNickname || actor.nickname || '익명')
      .slice(0, 3);
    const actorText =
      actorNames.length > 1
        ? `${actorNames[0]} 외 ${actorNames.length - 1}명`
        : actorNames[0];

    const title = activity.meta?.title as string | undefined;
    const beforeTitle = activity.meta?.beforeTitle as string | undefined;
    const afterTitle = activity.meta?.afterTitle as string | undefined;

    switch (activity.type) {
      case 'POST_COLLAB_START':
        return (
          <>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {actorText}
            </span>
            <span className="text-gray-600 dark:text-gray-300">
              이(가) 공동 작성을 시작했습니다
            </span>
          </>
        );
      case 'POST_COLLAB_COMPLETE':
        return (
          <>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {actorText}
            </span>
            <span className="text-gray-600 dark:text-gray-300">이(가) </span>
            {title && (
              <span className="font-medium text-itta-black dark:text-white">
                &quot;{title}&quot;
              </span>
            )}
            <span className="text-gray-600 dark:text-gray-300">
              {title ? ' 기록을 작성했습니다' : '기록을 작성했습니다'}
            </span>
          </>
        );
      case 'POST_EDIT_START':
        return (
          <>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {actorText}
            </span>
            <span className="text-gray-600 dark:text-gray-300">
              이(가) 기록 수정을 시작했습니다
            </span>
          </>
        );
      case 'POST_EDIT_COMPLETE':
        if (beforeTitle && afterTitle && beforeTitle !== afterTitle) {
          return (
            <>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {actorText}
              </span>
              <span className="text-gray-600 dark:text-gray-300">이(가) </span>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                &quot;{beforeTitle}&quot;
              </span>
              <span className="text-gray-600 dark:text-gray-300">을(를) </span>
              <span className="font-medium text-itta-black dark:text-white">
                &quot;{afterTitle}&quot;
              </span>
              <span className="text-gray-600 dark:text-gray-300">
                (으)로 수정했습니다
              </span>
            </>
          );
        }
        return (
          <>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {actorText}
            </span>
            <span className="text-gray-600 dark:text-gray-300">
              이(가) 기록을 수정했습니다
            </span>
          </>
        );
      case 'MEMBER_JOIN':
        return (
          <>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {actorText}
            </span>
            <span className="text-gray-600 dark:text-gray-300">
              이(가) 그룹에 참여했습니다
            </span>
          </>
        );
      case 'MEMBER_LEAVE':
        return (
          <>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {actorText}
            </span>
            <span className="text-gray-600 dark:text-gray-300">
              이(가) 그룹에서 나갔습니다
            </span>
          </>
        );
      default:
        return (
          <>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {actorText}
            </span>
            <span className="text-gray-600 dark:text-gray-300">
              의 활동이 있습니다
            </span>
          </>
        );
    }
  };

  const handleClick = () => {
    // refId가 있으면 해당 기록으로 이동
    if (activity.refId) {
      if (
        activity.type === 'POST_COLLAB_COMPLETE' ||
        activity.type === 'POST_EDIT_COMPLETE'
      ) {
        router.push(`/record/${activity.refId}`);
      } else if (activity.type === 'POST_COLLAB_START') {
        router.push(`/group/${groupId}/post/${activity.refId}`);
      }
    }
  };

  const firstActor = activity.actors[0];
  const hasClickAction =
    activity.refId &&
    (activity.type === 'POST_COLLAB_COMPLETE' ||
      activity.type === 'POST_EDIT_COMPLETE' ||
      activity.type === 'POST_COLLAB_START');

  const typeInfo = getActivityTypeInfo();
  const Icon = typeInfo.icon;

  return (
    <div
      onClick={hasClickAction ? handleClick : undefined}
      className={`flex gap-3 py-4 ${
        hasClickAction
          ? 'cursor-pointer hover:bg-gray-50/50 dark:hover:bg-white/5 active:bg-gray-100/50 dark:active:bg-white/10 transition-colors'
          : ''
      }`}
    >
      {/* 프로필 이미지와 타입 아이콘 */}
      <div className="shrink-0 relative">
        {firstActor?.profileImageId ? (
          <AssetImage
            assetId={firstActor.profileImageId}
            alt={firstActor.groupNickname || firstActor.nickname || ''}
            width={40}
            height={40}
            className="w-10 h-10 rounded-full"
          />
        ) : (
          <Image
            src="/profile_base.png"
            alt="프로필"
            width={40}
            height={40}
            className="w-10 h-10 rounded-full"
          />
        )}
        {/* 활동 타입 뱃지 */}
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 ${typeInfo.bgColor}`}
        >
          <Icon className={`w-3 h-3 ${typeInfo.iconColor}`} />
        </div>
      </div>

      {/* 메시지 */}
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-[13px] sm:text-[15px] leading-relaxed">
          {getActivityMessage()}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {formatDistanceToNow(new Date(activity.createdAt), {
            addSuffix: true,
            locale: ko,
          })}
        </p>
      </div>
    </div>
  );
}
