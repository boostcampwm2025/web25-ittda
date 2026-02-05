import { BaseUser, Location, MonthlyCart } from './profile';

export interface UserProfileResponse {
  userId: string;
  user: BaseUser & {
    provider: 'google' | 'kakao';
    providerId: string;
    profileImage:
      | undefined
      | {
          url: string;
        };
    settings: Record<string, unknown>;
    createdAt: string;
  };
  stats: {
    recentTags: string[];
    frequentTags: string[];
    recentEmotions: string[];
    frequentEmotions: string[];
    totalPosts: number;
    totalImages: number;
    frequentLocations: Location[];
    monthlyCounts: MonthlyCart[];
  };
}

export interface RecordPatternResponse {
  streak: number;
  monthlyRecordingDays: number;
}
