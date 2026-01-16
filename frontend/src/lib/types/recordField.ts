import { FieldType } from './record';

// 서버 전송용 RecordBlockType
export const RecordBlockType = {
  TEXT: 'TEXT',
  MOOD: 'MOOD',
  TAG: 'TAG',
  RATING: 'RATING',
  DATE: 'DATE',
  TIME: 'TIME',
  LOCATION: 'LOCATION',
  IMAGE: 'IMAGE',
  TABLE: 'TABLE',
} as const;

export type RecordBlockType =
  (typeof RecordBlockType)[keyof typeof RecordBlockType];

// 각 필드의 value 객체 형태로 타입 정의
export interface ContentValue {
  text: string;
}

export interface EmotionValue {
  mood: string;
}

export interface TagsValue {
  tags: string[];
}

export interface RatingValue {
  rating: number;
}

export interface DateValue {
  date: string;
}

export interface TimeValue {
  time: string;
}

export interface LocationValue {
  lat: number;
  lng: number;
  address: string;
  placeName?: string;
  radius?: number; // 선택적 필드 유지
}

export interface PhotoValue {
  mediaIds?: string[];
  tempUrls?: string[];
}

export interface TableValue {
  rows: number;
  cols: number;
  cells: string[][];
}

export interface MediaValue {
  image?: string;
  type: string;
  title: string;
  year?: string;
}

/* 공통 구조 */
// layout 구조
export interface BlockLayout {
  row: number;
  col: number;
  span: number;
}

export interface BaseBlock<T = unknown> {
  id: string;
  type: FieldType;
  value: T;
  layout: BlockLayout;
}

// 최종 RecordBlock 유니온 타입
export type RecordBlock =
  | (BaseBlock<ContentValue> & { type: 'content' })
  | (BaseBlock<EmotionValue> & { type: 'emotion' })
  | (BaseBlock<TagsValue> & { type: 'tags' })
  | (BaseBlock<RatingValue> & { type: 'rating' })
  | (BaseBlock<DateValue> & { type: 'date' })
  | (BaseBlock<TimeValue> & { type: 'time' })
  | (BaseBlock<LocationValue> & { type: 'location' })
  | (BaseBlock<PhotoValue> & { type: 'photos' })
  | (BaseBlock<TableValue> & { type: 'table' })
  | (BaseBlock<MediaValue> & { type: 'media' });

export type BaseBlockForLayout<T = unknown> = Omit<BaseBlock<T>, 'value'>;
export type BlockValue = RecordBlock['value'];
