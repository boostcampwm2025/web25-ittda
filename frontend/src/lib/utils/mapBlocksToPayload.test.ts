import { describe, it, expect } from 'vitest';
import { mapBlocksToPayload, RecordFieldtypeMap, ServerToFieldTypeMap } from './mapBlocksToPayload';
import type { RecordBlock } from '../types/record';

const layout = { row: 0, col: 0, span: 2 };

const sampleBlocks: RecordBlock[] = [
  { id: 'block-1', type: 'content', value: { text: '내용' }, layout },
  { id: 'block-2', type: 'emotion', value: { mood: '행복' }, layout },
  { id: 'block-3', type: 'tags', value: { tags: ['여행'] }, layout },
  { id: 'block-4', type: 'rating', value: { rating: 5 }, layout },
  { id: 'block-5', type: 'date', value: { date: '2024-01-01' }, layout },
];

describe('mapBlocksToPayload', () => {
  it('프론트 타입을 서버 타입으로 변환한다', () => {
    const result = mapBlocksToPayload(sampleBlocks);
    expect(result[0].type).toBe('TEXT');
    expect(result[1].type).toBe('MOOD');
    expect(result[2].type).toBe('TAG');
    expect(result[3].type).toBe('RATING');
    expect(result[4].type).toBe('DATE');
  });

  it('includeId가 false이면 id를 포함하지 않는다', () => {
    const result = mapBlocksToPayload(sampleBlocks, false);
    result.forEach((block) => {
      expect(block.id).toBeUndefined();
    });
  });

  it('includeId가 true이면 id를 포함한다', () => {
    const result = mapBlocksToPayload(sampleBlocks, true);
    expect(result[0].id).toBe('block-1');
    expect(result[1].id).toBe('block-2');
  });

  it('기본값은 includeId false다', () => {
    const result = mapBlocksToPayload(sampleBlocks);
    result.forEach((block) => {
      expect(block.id).toBeUndefined();
    });
  });

  it('value와 layout을 그대로 전달한다', () => {
    const result = mapBlocksToPayload(sampleBlocks);
    expect(result[0].value).toEqual({ text: '내용' });
    expect(result[0].layout).toEqual(layout);
  });

  it('알 수 없는 블록 타입이면 에러를 던진다', () => {
    const invalidBlock = [
      { id: 'x', type: 'unknown', value: {}, layout },
    ] as unknown as RecordBlock[];

    expect(() => mapBlocksToPayload(invalidBlock)).toThrowError(
      'Unknown block type: unknown',
    );
  });

  it('빈 배열이면 빈 배열을 반환한다', () => {
    expect(mapBlocksToPayload([])).toEqual([]);
  });
});

describe('RecordFieldtypeMap', () => {
  it('content는 TEXT로 매핑된다', () => {
    expect(RecordFieldtypeMap['content']).toBe('TEXT');
  });

  it('emotion은 MOOD로 매핑된다', () => {
    expect(RecordFieldtypeMap['emotion']).toBe('MOOD');
  });

  it('photos는 IMAGE로 매핑된다', () => {
    expect(RecordFieldtypeMap['photos']).toBe('IMAGE');
  });
});

describe('ServerToFieldTypeMap', () => {
  it('TEXT는 content로 매핑된다', () => {
    expect(ServerToFieldTypeMap['TEXT']).toBe('content');
  });

  it('MOOD는 emotion으로 매핑된다', () => {
    expect(ServerToFieldTypeMap['MOOD']).toBe('emotion');
  });

  it('IMAGE는 photos로 매핑된다', () => {
    expect(ServerToFieldTypeMap['IMAGE']).toBe('photos');
  });
});
