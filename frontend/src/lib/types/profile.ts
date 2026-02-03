import { Tag } from './record';

export interface ProfileTag {
  recent: Tag[];
  frequent: Tag[];
  all: Tag[];
}

export interface TagStatSummary {
  recentTags: Tag[];
  frequentTags: Tag[];
}

export type EmotionStatSummary = {
  emotion: Emotion[];
  totalCount: number;
};

export interface Emotion {
  emotion: string;
  count: number;
}

export interface Location {
  placeName: string;
  count: number;
}

export interface MonthlyCart {
  month: string;
  count: number;
}

export interface ProfileEmotion {
  recent: Emotion[];
  frequent: Emotion[];
  all: Emotion[];
}

export interface BaseUser {
  id: string;
  email: string | null;
  nickname: string | null;
  profileImageId: string | null;
}

export interface UserProfile extends BaseUser {
  provider: string | null;
  createdAt: string;
}

export interface GuestInfo {
  guest: boolean;
  guestSessionId: string;
  guestAccessToken: string;
  expiresAt: string;
}

export type UserType = 'social' | 'guest';
