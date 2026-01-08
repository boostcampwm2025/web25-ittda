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
