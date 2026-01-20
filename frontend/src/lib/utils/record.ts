import {
  ContentValue,
  DateValue,
  EmotionValue,
  LocationValue,
  MediaValue,
  PhotoValue,
  RatingValue,
  RecordBlock,
  TableValue,
  TagsValue,
  TimeValue,
} from '../types/recordField';
import { RecordPreview } from '../types/recordResponse';

// 1. 오버로딩 정의: 입력하는 type에 따라 반환 타입을 명시적으로 매핑
export function getBlockValue(
  blocks: RecordBlock[],
  type: 'content',
): ContentValue | undefined;
export function getBlockValue(
  blocks: RecordBlock[],
  type: 'emotion',
): EmotionValue | undefined;
export function getBlockValue(
  blocks: RecordBlock[],
  type: 'tags',
): TagsValue | undefined;
export function getBlockValue(
  blocks: RecordBlock[],
  type: 'rating',
): RatingValue | undefined;
export function getBlockValue(
  blocks: RecordBlock[],
  type: 'date',
): DateValue | undefined;
export function getBlockValue(
  blocks: RecordBlock[],
  type: 'time',
): TimeValue | undefined;
export function getBlockValue(
  blocks: RecordBlock[],
  type: 'location',
): LocationValue | undefined;
export function getBlockValue(
  blocks: RecordBlock[],
  type: 'photos',
): PhotoValue | undefined;
export function getBlockValue(
  blocks: RecordBlock[],
  type: 'table',
): TableValue | undefined;
export function getBlockValue(
  blocks: RecordBlock[],
  type: 'media',
): MediaValue | undefined;

/**
 * 블록 배열에서 특정 타입의 첫 번째 블록 값을 찾아 반환
 * @param blocks - 검색할 블록 배열
 * @param type - 찾으려는 블록의 타입 (예: 'content', 'emotion' 등)
 * @returns 해당 블록의 value 또는 undefined
 */
export function getBlockValue(blocks: RecordBlock[], type: string) {
  const block = blocks.find((b) => b.type === type);
  return block ? block.value : undefined;
}

export function getBlockValues(
  blocks: RecordBlock[],
  type: 'content',
): ContentValue[];
export function getBlockValues(
  blocks: RecordBlock[],
  type: 'emotion',
): EmotionValue[];
export function getBlockValues(
  blocks: RecordBlock[],
  type: 'tags',
): TagsValue[];
export function getBlockValues(
  blocks: RecordBlock[],
  type: 'rating',
): RatingValue[];
export function getBlockValues(
  blocks: RecordBlock[],
  type: 'date',
): DateValue[];
export function getBlockValues(
  blocks: RecordBlock[],
  type: 'time',
): TimeValue[];
export function getBlockValues(
  blocks: RecordBlock[],
  type: 'location',
): LocationValue[];
export function getBlockValues(
  blocks: RecordBlock[],
  type: 'photos',
): PhotoValue[];
export function getBlockValues(
  blocks: RecordBlock[],
  type: 'table',
): TableValue[];
export function getBlockValues(
  blocks: RecordBlock[],
  type: 'media',
): MediaValue[];

/**
 * 특정 타입의 모든 블록 값을 찾아 배열로 반환
 */
export function getBlockValues(blocks: RecordBlock[], type: string) {
  return blocks
    .filter((block) => block.type === type)
    .map((block) => block.value);
}

export const getSingleBlockValue = <T>(
  record: RecordPreview,
  type: string,
): T | undefined => {
  return record.blocks.find((b) => b.type === type)?.value as T;
};
