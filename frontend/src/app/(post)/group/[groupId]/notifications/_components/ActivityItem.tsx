'use client';

import { GroupActivityItem } from '@/lib/types/group';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import AssetImage from '@/components/AssetImage';
import Image from 'next/image';
import { ActivityMessage } from './ActivityMessage';
import { getActivityTypeTheme } from '../_utils/activityHelper';
import { formatDateDot, formatDateTime } from '@/lib/date';

interface ActivityItemProps {
  activity: GroupActivityItem;
  groupId: string;
}

export function ActivityItem({ activity, groupId }: ActivityItemProps) {
  const router = useRouter();
  const {
    icon: Icon,
    bgColor,
    iconColor,
  } = getActivityTypeTheme(activity.type);
  const firstActor = activity.actors[0];
  const activityDate = new Date(activity.createdAt);

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

  const hasClickAction =
    activity.refId &&
    (activity.type === 'POST_COLLAB_COMPLETE' ||
      activity.type === 'POST_EDIT_COMPLETE' ||
      activity.type === 'POST_COLLAB_START');

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
          className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 ${bgColor}`}
        >
          <Icon className={`w-3 h-3 ${iconColor}`} />
        </div>
      </div>

      {/* 메시지 */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="text-[13px] sm:text-[15px] leading-relaxed">
          <ActivityMessage activity={activity} />
        </div>

        {/* 절대 시간 */}
        <span className="text-[11px] text-gray-400 dark:text-gray-500">
          {`${formatDateDot(activityDate)} ${formatDateTime(activityDate).time}`}
        </span>
        <span className="text-[10px] text-gray-300 dark:text-gray-600 mx-1">
          •
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {formatDistanceToNow(new Date(activity.createdAt), {
            addSuffix: true,
            locale: ko,
          })}
        </span>
      </div>
    </div>
  );
}
