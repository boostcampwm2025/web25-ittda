import { Tag } from './record';

export interface ProfileTag {
  recent: Tag[];
  frequent: Tag[];
  all: Tag[];
}

export interface TagStatSummary {
  recentTop: Tag[];
  allTimeTop: Tag[];
}

export type EmotionStatSummary = Emotion[];

export interface Emotion {
  emotion: string;
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
  expiresAt: string;
}

export type UserType = 'social' | 'guest';
