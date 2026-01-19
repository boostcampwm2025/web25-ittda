// Mypage 관련 인터페이스
export interface TagCount {
  tag: string;
  count: number;
}

export interface EmotionCount {
  emotion: string;
  count: number;
}

export interface UserStats {
  recentTags: string[];
  frequentTags: string[];
  recentEmotions: string[];
  frequentEmotions: string[];
}
