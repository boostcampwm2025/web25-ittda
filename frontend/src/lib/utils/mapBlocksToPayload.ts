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
 * block 내부 id 제거 및 type 서버 형태로 변환
 * @param blocks
 * @returns RecordBlock[]
 */
export function mapBlocksToPayload(blocks: RecordBlock[]) {
  return blocks.map((block) => {
    const serverType = RecordFieldtypeMap[block.type];
    if (!serverType) {
      throw new Error(`Unknown block type: ${block.type}`);
    }

    return {
      type: serverType,
      value: block.value,
      layout: block.layout,
    };
  });
}
