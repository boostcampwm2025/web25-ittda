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
  streak: number; // 연속 작성 일수
  monthlyRecordingDays: number; // 이번달 기록 일수
  totalPosts: number; // 총 기록 수
  totalImages: number; // 총 이미지 수
  frequentLocations: { placeName: string; count: number }[]; // 방문 장소 통계 (TOP 5)
}
