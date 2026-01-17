import { Tag } from './record';

export interface ProfileTag {
  recent: Tag[];
  frequent: Tag[];
  all: Tag[];
}

export interface Emotion {
  name: string;
  emoji: string;
  count: number;
}

export interface ProfileEmotion {
  recent: Emotion[];
  frequent: Emotion[];
  all: Emotion[];
}

export interface UserProfile {
  id: string;
  email: string | null;
  nickname: string | null;
  provider: string;
  createdAt: string;
  profileImage: string;
}

export interface GuestInfo {
  guest: boolean;
  guestSessionId: string;
  expiresAt: string;
}

export interface SocialUser {
  id: string;
  nickname: string;
  profileImageUrl: string;
  updatedAt: string;
}

export type UserType = 'social' | 'guest';
