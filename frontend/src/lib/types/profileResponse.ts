import { BaseUser } from './profile';

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
  stat: {
    recentTags: string[];
    frequentTags: string[];
    recentEmotions: string[];
    frequentEmotions: string[];
  };
}

export interface RecordPatternResponse {
  count: number;
}
