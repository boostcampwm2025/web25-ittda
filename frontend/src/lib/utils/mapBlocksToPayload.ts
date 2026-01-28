import { BlockValue, CreateRecordBlock } from '../types/record';
import { FieldType, RecordBlock, RecordBlockType } from '../types/recordField';

//프론트 editor 내부 타입 → 서버용 대문자 타입 매핑
export const RecordFieldtypeMap: Record<string, RecordBlockType> = {
  text: RecordBlockType.TEXT,
  content: RecordBlockType.TEXT,
  mood: RecordBlockType.MOOD,
  emotion: RecordBlockType.MOOD,
  tags: RecordBlockType.TAG,
  rating: RecordBlockType.RATING,
  date: RecordBlockType.DATE,
  time: RecordBlockType.TIME,
  location: RecordBlockType.LOCATION,
  photos: RecordBlockType.IMAGE,
  media: RecordBlockType.MEDIA,
  table: RecordBlockType.TABLE,
};

// 서버 타입 -> 프론트 에디터 타입
export const ServerToFieldTypeMap: Record<string, FieldType> = {
  TEXT: 'content',
  MOOD: 'emotion',
  TAG: 'tags',
  RATING: 'rating',
  DATE: 'date',
  TIME: 'time',
  LOCATION: 'location',
  IMAGE: 'photos',
  TABLE: 'table',
  MEDIA: 'media',
};

/**
 * 내부 editor용 block 배열을 서버 전송용 block 배열로 변환
 * @param blocks
 * @param includeId - id 포함 여부 (Draft 저장 시 true)
 * @returns CreateRecordBlock[]
 */
export function mapBlocksToPayload(
  blocks: RecordBlock[],
  includeId: boolean = false,
): CreateRecordBlock[] {
  return blocks.map((block) => {
    const serverType = RecordFieldtypeMap[block.type];
    if (!serverType) {
      throw new Error(`Unknown block type: ${block.type}`);
    }

    const payloadBlock: CreateRecordBlock = {
      type: serverType,
      value: block.value as BlockValue,
      layout: block.layout,
    };

    // draft인 경우에만 id 추가
    if (includeId) {
      payloadBlock.id = block.id;
    }

    return payloadBlock;
  });
}
