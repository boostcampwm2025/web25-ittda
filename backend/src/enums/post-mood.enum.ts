export const PostMood = {
  HAPPY: '행복',
  SAD: '슬픔',
  EXCITED: '설렘',
  GOOD: '좋음',
  SURPRISED: '놀람',
  ANGRY: '분노',
  TIRED: '피곤',
  WARM: '따뜻함',
  CALM_SOFT: '차분함',
  ANXIOUS: '불안',
} as const;

export type PostMood = (typeof PostMood)[keyof typeof PostMood];
