import { Tag } from './record';

export interface ProfileTag {
  recent: Tag[];
  frequent: Tag[];
  all: Tag[];
}

export interface Profile {
  image: string;
  nickname: string;
  email: string;
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
