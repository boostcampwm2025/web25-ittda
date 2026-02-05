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
    case 'media':
      return { title: '', type: '', externalId: '' };

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
export const isRecordBlockEmpty = (
  value: BlockValue,
  isSaveMode: boolean = false,
): boolean => {
  if (!value) return true;

  // 텍스트
  if ('text' in value) {
    if (!isSaveMode) return false;
    return !value.text || value.text.trim().length === 0;
  }

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

  //테이블
  if ('cells' in value) {
    if (!isSaveMode) return false;
    // 모든 셀이 비어있거나 행/열이 0인 경우
    return (
      !value.cells ||
      value.cells.length === 0 ||
      value.cells.every((row) =>
        row.every((cell) => !cell || cell.trim() === ''),
      )
    );
  }

  //미디어
  if ('externalId' in value) {
    return !value.type || !value.title;
  }

  return false;
};

/**
 * 기록 저장 전 유효성 검사 및 빈 블록 필터링
 */
export const validateAndCleanRecord = (
  title: string,
  blocks: RecordBlock[],
) => {
  // 제목 검사
  if (!title.trim()) {
    return {
      isValid: false,
      message: '기록의 제목을 입력해주세요.',
      filteredBlocks: [],
    };
  }

  // 빈 블록 필터링
  const filteredBlocks: RecordBlock[] = [];

  for (const block of blocks) {
    const isEmpty = isRecordBlockEmpty(block.value, true);

    if (isEmpty) {
      return {
        isValid: false,
        message:
          '값이 비어있는 필드가 있습니다. 해당 필드를 제거하거나 값을 입력해주세요.',
        filteredBlocks: [],
      };
    }

    filteredBlocks.push(block);
  }

  // 최소 1개 이상 텍스트 블록이 있는지
  const hasContent = filteredBlocks.some((b) => b.type === 'content');
  if (!hasContent) {
    return {
      isValid: false,
      message: '최소 하나 이상의 내용을 입력해주세요.',
      filteredBlocks,
    };
  }

  return { isValid: true, filteredBlocks, message: '' };
};
