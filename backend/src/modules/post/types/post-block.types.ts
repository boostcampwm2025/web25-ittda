import { PostBlockType } from '@/enums/post-block-type.enum';

export type BlockValueMap = {
  [PostBlockType.TEXT]: { text: string };
  [PostBlockType.MOOD]: { mood: string };
  [PostBlockType.TAG]: { tags: string[] };
  [PostBlockType.RATING]: { rating: number };
  [PostBlockType.DATE]: { date: string };
  [PostBlockType.TIME]: { time: string };
  [PostBlockType.LOCATION]: {
    lat: number;
    lng: number;
    address: string;
    placeName?: string;
  };
  [PostBlockType.IMAGE]: { mediaIds?: string[]; tempUrls?: string[] };
  [PostBlockType.TABLE]: { rows: number; cols: number; cells: string[][] };
};

export type PostBlock = {
  [K in keyof BlockValueMap]: { type: K; value: BlockValueMap[K] };
}[keyof BlockValueMap];
