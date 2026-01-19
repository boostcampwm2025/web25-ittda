// 모든 타입은 record.ts에서 통합 관리됩니다.
// 하위 호환성을 위해 re-export합니다.
export {
  type FieldType,
  type Emotion,
  type TextValue as ContentValue,
  type MoodValue as EmotionValue,
  type TagValue as TagsValue,
  type RatingValue,
  type DateValue,
  type TimeValue,
  type LocationValue,
  type ImageValue as PhotoValue,
  type TableValue,
  type MediaInfoValue as MediaValue,
  type BlockLayout,
  type BaseBlock,
  type RecordBlock,
  type BaseBlockForLayout,
  type BlockValue,
} from './record';

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
