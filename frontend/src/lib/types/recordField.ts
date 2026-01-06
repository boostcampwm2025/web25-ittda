import { FieldType } from './record';

export interface Emotion {
  emoji: string;
  label: string;
}

export interface LocationValue {
  lat?: number;
  lng?: number;
  radius?: number;
  address?: string;
}

export interface MediaValue {
  image: string;
  type: string;
  title: string;
  year?: string;
}

export interface BlockLayout {
  row: number;
  col: number;
  span: number;
}

// 각 블록 단위
export interface BaseBlock<T = unknown> {
  id?: string;
  type: FieldType;
  value: T;
  layout: BlockLayout;
}

export type PostBlock =
  | (BaseBlock<string> & { type: 'content' })
  | (BaseBlock<string> & { type: 'emotion' })
  | (BaseBlock<LocationValue> & { type: 'location' })
  | (BaseBlock<string[]> & { type: 'tags' })
  | (BaseBlock<number> & { type: 'rating' })
  | (BaseBlock<MediaValue> & { type: 'media' })
  | (BaseBlock<string[][]> & { type: 'table' })
  | (BaseBlock<string> & { type: 'date' })
  | (BaseBlock<string> & { type: 'time' })
  | (BaseBlock<File> & { type: 'photos' });
