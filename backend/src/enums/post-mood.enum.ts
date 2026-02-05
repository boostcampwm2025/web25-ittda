export const PostMood = {
  HAPPY: '행복',
  GOOD: '좋음',
  SATISFIED: '만족',
  FUN: '재미',
  NORMAL: '보통',
  TIRED: '피곤',
  SURPRISED: '놀람',
  ANGRY: '화남',
  SAD: '슬픔',
  SICK: '아픔',
  ANNOYED: '짜증',
} as const;

export type PostMood = (typeof PostMood)[keyof typeof PostMood];
