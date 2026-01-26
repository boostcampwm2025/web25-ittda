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
  totalPosts: number;
  totalImages: number;
  frequentLocations: { placeName: string; count: number }[];
}
