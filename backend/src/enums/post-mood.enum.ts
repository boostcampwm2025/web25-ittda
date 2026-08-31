export const PostMood = {
  HAPPY: '행복',
  GOOD: '좋음',
  SATISFIED: '만족',
  FUN: '재미',
  MOVED: '감동',
  NORMAL: '보통',
  EMPTY: '공허',
  TIRED: '피곤',
  BUSY: '바쁨',
  BORED: '심심',
  WORRIED: '걱정',
  ANXIOUS: '불안',
  SECRET: '비밀',
  SURPRISED: '놀람',
  ANGRY: '화남',
  SAD: '슬픔',
  DEPRESSED: '우울',
  SICK: '아픔',
  ANNOYED: '짜증',
} as const;

export type PostMood = (typeof PostMood)[keyof typeof PostMood];
