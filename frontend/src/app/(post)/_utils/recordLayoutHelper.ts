import { FieldType } from '@/lib/types/record';
import { PostBlock } from '@/lib/types/recordField';
import { formatDateDot, formatTime } from '@/lib/date';

// 해당 타입의 기본값 생성
export const getDefaultValue = (type: FieldType): PostBlock['value'] => {
  switch (type) {
    case 'date':
      return formatDateDot(new Date());
    case 'time':
      return formatTime(new Date());
    case 'rating':
      return 0;
    case 'tags':
      return [];
    case 'photos':
      return [];
    case 'table':
      return [
        ['', ''],
        ['', ''],
      ];
    case 'content':
      return '';
    case 'emotion':
      return '';
    case 'location':
      return { address: '' };
    case 'media':
      return { image: '', type: '', title: '', year: '' };
    default:
      return '';
  }
};

// 그리드 레이아웃 좌표 재계산
export const normalizeLayout = (targetBlocks: PostBlock[]): PostBlock[] => {
  const result: PostBlock[] = [];
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
