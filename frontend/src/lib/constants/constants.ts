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

export const EMOTIONS = [
  { emoji: '😊', label: '행복' },
  { emoji: '😢', label: '슬픔' },
  { emoji: '🤩', label: '설렘' },
  { emoji: '🥰', label: '좋음' },
  { emoji: '😮', label: '놀람' },
  { emoji: '😡', label: '화남' },
  { emoji: '😴', label: '피곤' },
  { emoji: '🥣', label: '따뜻함' },
  { emoji: '📖', label: '차분함' },
];
