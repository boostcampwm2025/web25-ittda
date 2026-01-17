export const PostMood = {
  HAPPY: '행복',
  SAD: '슬픔',
  EXCITED: '설렘',
  GOOD: '좋음',
  SURPRISED: '놀람',
} as const;

export type PostMood = (typeof PostMood)[keyof typeof PostMood];
