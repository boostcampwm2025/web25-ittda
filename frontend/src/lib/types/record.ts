import { Contributor } from './recordResponse';

export type TemplateType =
  | 'diary'
  | 'travel'
  | 'movie'
  | 'musical'
  | 'theater'
  | 'memo'
  | 'etc';

export type FieldType =
  | 'emotion'
  | 'photos'
  | 'location'
  | 'rating'
  | 'content'
  | 'tags'
  | 'table'
  | 'date'
  | 'time'
  | 'media';

export interface MonthRecord {
  id: string;
  name: string;
  count: number;
  latestTitle: string;
  latestLocation: string;
  cover: {
    assetId: string;
    width: number;
    height: number;
    mimeType: string;
  } | null;
}

export interface SharedRecord {
  id: string;
  name: string;
  members: number;
  count: number;
  latestTitle: string;
  latestLocation: string;
  updatedAt: number;
  hasNotification: boolean;
  coverUrl: string | null;
}

export interface DayRecord {
  date: string;
  dayName: string;
  title: string;
  count: number;
  coverUrl: string;
}

export interface Tag {
  tag: string;
  count: number;
}

export interface PostListItem {
  id: string;
  title: string;
  templateType?: TemplateType;
  address: string;
  lat: number;
  lng: number;
  createdAt: string;
  eventDate: string;
  content: string;
  imageUrl?: string;
  tags?: string[];
}

export interface RecordSearchItem {
  id: string;
  title: string;
  address: string;
  date: string;
  content: string;
  thumbnailMediaId: string;
  snippet?: string;
}

export type RecordScope = 'PERSONAL' | 'GROUP';
export type CreateRecordBlock = Omit<Block, 'id'> & { id?: string };

export interface CreateRecordRequest {
  scope?: RecordScope;
  groupId?: string | null;
  title: string;
  thumbnailMediaId?: string;
  blocks: CreateRecordBlock[];
}

export type BlockType =
  | 'DATE'
  | 'TIME'
  | 'TEXT'
  | 'TAG'
  | 'RATING'
  | 'IMAGE'
  | 'LOCATION'
  | 'MOOD'
  | 'TABLE'
  | 'MEDIA';

export interface BlockLayout {
  row: number;
  col: number;
  span: number;
}

export interface TextValue {
  text: string;
}

export interface MoodValue {
  mood: string;
}

export interface TagValue {
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
  radius?: number;
}

export interface ImageValue {
  mediaIds?: string[];
  tempUrls?: string[];
  resolvedUrls?: string[];
}

export interface TableValue {
  rows: number;
  cols: number;
  cells: string[][];
}

export interface MediaInfoValue {
  title: string;
  type: string;
  externalId: string;
  year?: string;
  imageUrl?: string;
  originalTitle?: string | null;
}

export type BlockValue =
  | TextValue
  | MoodValue
  | TagValue
  | RatingValue
  | DateValue
  | TimeValue
  | LocationValue
  | ImageValue
  | TableValue
  | MediaInfoValue;

// recordField.ts에서 통합된 타입들
export interface Emotion {
  emoji: string;
  label: string;
}

export interface BaseBlock<T = unknown> {
  id: string;
  type: FieldType;
  value: T;
  layout: BlockLayout;
}

// RecordBlock 유니온 타입 (FieldType 기반)
export type RecordBlock =
  | (BaseBlock<TextValue> & { type: 'content' })
  | (BaseBlock<MoodValue> & { type: 'emotion' })
  | (BaseBlock<TagValue> & { type: 'tags' })
  | (BaseBlock<RatingValue> & { type: 'rating' })
  | (BaseBlock<DateValue> & { type: 'date' })
  | (BaseBlock<TimeValue> & { type: 'time' })
  | (BaseBlock<LocationValue> & { type: 'location' })
  | (BaseBlock<ImageValue> & { type: 'photos' })
  | (BaseBlock<TableValue> & { type: 'table' })
  | (BaseBlock<MediaInfoValue> & { type: 'media' });

export type BaseBlockForLayout<T = unknown> = Omit<BaseBlock<T>, 'value'>;

export interface Block {
  id: string;
  type: BlockType;
  value: BlockValue;
  layout: BlockLayout;
}

export interface RecordContributor {
  userId: string;
  role: 'AUTHOR' | 'EDITOR';
  nickname: string;
}

export interface RecordDetailResponse {
  id: string;
  scope: RecordScope;
  ownerUserId: string;
  groupId: string | null;
  title: string;
  createdAt: string;
  updatedAt: string;
  blocks: Block[];
  contributors: Contributor[];
  hasActiveEditDraft?: boolean;
}

// 지도 리스트 아이템
export interface MapPostItem {
  id: string;
  lat: number;
  lng: number;
  title: string;
  thumbnailMediaId: string;
  createdAt: string;
  tags: string[];
  placeName: string | null;
}
