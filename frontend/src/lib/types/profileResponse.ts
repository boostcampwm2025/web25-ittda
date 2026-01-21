import { BaseUser, EmotionStatSummary, TagStatSummary } from './profile';

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
  stat: TagStatSummary & EmotionStatSummary;
}
