import {
  LucideIcon,
  PlusCircle,
  PenTool,
  Clock,
  Edit,
  Trash2,
  UserPlus,
  UserMinus,
  RefreshCw,
  Settings,
  Image as ImageIcon,
  FileText,
} from 'lucide-react';
import { GroupActivityItem } from '@/lib/types/group';

export const getActivityTypeTheme = (type: string) => {
  const themes: Record<
    string,
    { icon: LucideIcon; bgColor: string; iconColor: string }
  > = {
    POST_CREATE: {
      icon: PlusCircle,
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    POST_COLLAB_COMPLETE: {
      icon: PlusCircle,
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    POST_COLLAB_START: {
      icon: PenTool,
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    POST_EDIT_START: {
      icon: Clock,
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    POST_EDIT_COMPLETE: {
      icon: Edit,
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
    POST_UPDATE: {
      icon: Edit,
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
    POST_DELETE: {
      icon: Trash2,
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-400',
    },
    MEMBER_JOIN: {
      icon: UserPlus,
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
    },
    MEMBER_LEAVE: {
      icon: UserMinus,
      bgColor: 'bg-rose-100 dark:bg-rose-900/30',
      iconColor: 'text-rose-600 dark:text-rose-400',
    },
    MEMBER_REMOVE: {
      icon: UserMinus,
      bgColor: 'bg-rose-100 dark:bg-rose-900/30',
      iconColor: 'text-rose-600 dark:text-rose-400',
    },
    MEMBER_ROLE_CHANGE: {
      icon: RefreshCw,
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    GROUP_NAME_UPDATE: {
      icon: Settings,
      bgColor: 'bg-slate-100 dark:bg-slate-700/30',
      iconColor: 'text-slate-600 dark:text-slate-400',
    },
    GROUP_COVER_UPDATE: {
      icon: ImageIcon,
      bgColor: 'bg-pink-100 dark:bg-pink-900/30',
      iconColor: 'text-pink-600 dark:text-pink-400',
    },
    GROUP_MONTH_COVER_UPDATE: {
      icon: ImageIcon,
      bgColor: 'bg-pink-100 dark:bg-pink-900/30',
      iconColor: 'text-pink-600 dark:text-pink-400',
    },
  };

  return (
    themes[type] || {
      icon: FileText,
      bgColor: 'bg-gray-100 dark:bg-gray-700/30',
      iconColor: 'text-gray-600 dark:text-gray-400',
    }
  );
};

export const getActorText = (actors: GroupActivityItem['actors']) => {
  const names = actors
    .map((a) => a.groupNickname || a.nickname || '익명')
    .slice(0, 3);
  return names.length > 1
    ? `${names[0]}님 외 ${names.length - 1}명`
    : `${names[0]}님`;
};

export const getActorParts = (actors: GroupActivityItem['actors']) => {
  const names = actors
    .map((a) => a.groupNickname || a.nickname || '익명')
    .slice(0, 3);

  if (names.length > 1) {
    return {
      name: names[0],
      suffix: `님 외 ${names.length - 1}명`,
    };
  }

  return {
    name: names[0],
    suffix: '님',
  };
};
