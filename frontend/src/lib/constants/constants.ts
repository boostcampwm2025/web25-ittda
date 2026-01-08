import type { TemplateType } from '@/lib/types/record';

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
  행복: '😊',
  슬픔: '😢',
  설렘: '🤩',
  좋음: '🥰',
  놀람: '😮',
  화남: '😡',
  피곤: '😴',
  따뜻함: '🥣',
  차분함: '📖',
} as const;

export const EMOTIONS = Object.entries(EMOTION_MAP).map(([label, emoji]) => ({
  emoji,
  label,
}));
