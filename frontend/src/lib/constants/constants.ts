import type { TemplateType } from '@/lib/types/record';

// 개인 영역 캐싱: 본인만 수정 가능하므로 staleTime 설정
export const PERSONAL_STALE_TIME = 5 * 60 * 1000; // 5분

export const TEMPLATE_LABEL: Record<TemplateType, string> = {
  diary: '일기',
  travel: '여행',
  movie: '영화',
  musical: '뮤지컬',
  theater: '연극',
  memo: '메모',
  etc: '기타',
};

export const EMOTION_MAP: Record<string, string> = {
  행복: '🥰',
  좋음: '😊',
  만족: '😌',
  재미: '😆',
  보통: '😐',
  피곤: '😴',
  놀람: '😲',
  화남: '😡',
  슬픔: '😢',
  아픔: '🤒',
  짜증: '😫',
} as const;

export const EMOTIONS = Object.entries(EMOTION_MAP).map(([label, emoji]) => ({
  emoji,
  label,
}));

export const GroupActivityType = {
  POST_COLLAB_START: 'POST_COLLAB_START',
  POST_EDIT_START: 'POST_EDIT_START',
  POST_COLLAB_COMPLETE: 'POST_COLLAB_COMPLETE',
  POST_EDIT_COMPLETE: 'POST_EDIT_COMPLETE',
  POST_CREATE: 'POST_CREATE',
  POST_UPDATE: 'POST_UPDATE',
  POST_DELETE: 'POST_DELETE',
  MEMBER_JOIN: 'MEMBER_JOIN',
  MEMBER_LEAVE: 'MEMBER_LEAVE',
  MEMBER_REMOVE: 'MEMBER_REMOVE',
  MEMBER_ROLE_CHANGE: 'MEMBER_ROLE_CHANGE',
  GROUP_COVER_UPDATE: 'GROUP_COVER_UPDATE',
  GROUP_NAME_UPDATE: 'GROUP_NAME_UPDATE',
  MEMBER_NICKNAME_CHANGE: 'MEMBER_NICKNAME_CHANGE',
  GROUP_MONTH_COVER_UPDATE: 'GROUP_MONTH_COVER_UPDATE',
  GROUP_CREATE: 'GROUP_CREATE',
} as const;

export type GroupActivityType =
  (typeof GroupActivityType)[keyof typeof GroupActivityType];
