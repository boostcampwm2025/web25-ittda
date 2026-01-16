import { FieldType } from '@/lib/types/record';
import { BlockValue, PhotoValue, RecordBlock } from '@/lib/types/recordField';
import { getDateMetadata } from '@/lib/date';

// 해당 타입의 기본값 생성
export const getDefaultValue = (type: FieldType): RecordBlock['value'] => {
  const { date, time } = getDateMetadata(new Date());
  switch (type) {
    case 'date':
      return { date };
    case 'time':
      return { time };
    case 'content':
      return { text: '' };
    case 'emotion':
      return { mood: '' };
    case 'tags':
      return { tags: [] };
    case 'rating':
      return { rating: 0 };
    case 'location':
      return { lat: 0, lng: 0, address: '', placeName: '' };
    case 'photos':
      return { mediaIds: [], tempUrls: [] };
    case 'table':
      return {
        rows: 2,
        cols: 2,
        cells: [
          ['', ''],
          ['', ''],
        ],
      };
    default:
      return {};
  }
};

// 그리드 레이아웃 좌표 재계산
export const normalizeLayout = (targetBlocks: RecordBlock[]): RecordBlock[] => {
  const result: RecordBlock[] = [];
  let i = 0;

  while (i < targetBlocks.length) {
    const current = { ...targetBlocks[i] };

    if (current.layout.span === 1) {
      const next = targetBlocks[i + 1];
      if (next && next.layout.span === 1) {
        result.push({ ...current, layout: { ...current.layout, span: 1 } });
        result.push({ ...next, layout: { ...next.layout, span: 1 } });
        i += 2;
      } else {
        // 1열 블록 없으면 확장되도록
        result.push({ ...current, layout: { ...current.layout, span: 2 } });
        i += 1;
      }
    } else {
      // 원래 2열인 블록은 그대로 유지
      result.push({ ...current, layout: { ...current.layout, span: 2 } });
      i += 1;
    }
  }

  // Row/Col 최종 좌표
  let currentRow = 1;
  let currentCol = 1;

  return result.map((block) => {
    const updated = {
      ...block,
      layout: { ...block.layout, row: currentRow, col: currentCol },
    };

    currentCol += block.layout.span;
    if (currentCol > 2) {
      currentRow++;
      currentCol = 1;
    }
    return updated;
  });
};

export const canBeHalfWidth = (type: FieldType) =>
  [
    'date',
    'emotion',
    'location',
    'rating',
    'time',
    'media',
    'content',
    'tags',
  ].includes(type);

// 레코드 블록의 값인 객체의 내부 내용이 비어있는지 확인
export const isRecordBlockEmpty = (value: BlockValue): boolean => {
  if (!value) return true;

  // 태그
  if ('tags' in value) {
    return value.tags.length === 0;
  }

  // 사진
  if ('mediaIds' in value || 'tempUrls' in value) {
    const v = value as PhotoValue;
    return (v.mediaIds?.length ?? 0) === 0 && (v.tempUrls?.length ?? 0) === 0;
  }

  // 감정
  if ('mood' in value) {
    return !value.mood;
  }

  // 별점
  if ('rating' in value) {
    return value.rating === 0;
  }

  // 위치
  if ('address' in value) {
    return !value.lat || !value.lng;
  }

  return false;
};
