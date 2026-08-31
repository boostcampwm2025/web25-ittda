import { describe, it, expect } from 'vitest';
import { getBlockValue, getBlockValues, getSingleBlockValue } from './record';
import type { RecordBlock } from '../types/record';
import type { RecordPreview } from '../types/recordResponse';

const layout = { row: 0, col: 0, span: 2 };

const blocks: RecordBlock[] = [
  { id: '1', type: 'content', value: { text: '오늘의 기록' }, layout },
  { id: '2', type: 'emotion', value: { mood: '행복' }, layout },
  { id: '3', type: 'tags', value: { tags: ['여행', '맛집'] }, layout },
  { id: '4', type: 'content', value: { text: '두 번째 내용' }, layout },
  { id: '5', type: 'rating', value: { rating: 4 }, layout },
];

describe('getBlockValue', () => {
  it('존재하는 타입의 첫 번째 블록 값을 반환한다', () => {
    expect(getBlockValue(blocks, 'content')).toEqual({ text: '오늘의 기록' });
  });

  it('같은 타입이 여러 개면 첫 번째만 반환한다', () => {
    const result = getBlockValue(blocks, 'content');
    expect(result).toEqual({ text: '오늘의 기록' });
  });

  it('emotion 타입의 값을 반환한다', () => {
    expect(getBlockValue(blocks, 'emotion')).toEqual({ mood: '행복' });
  });

  it('존재하지 않는 타입이면 undefined를 반환한다', () => {
    expect(getBlockValue(blocks, 'date')).toBeUndefined();
  });

  it('블록 배열이 비어 있으면 undefined를 반환한다', () => {
    expect(getBlockValue([], 'content')).toBeUndefined();
  });
});

describe('getBlockValues', () => {
  it('존재하는 타입의 모든 블록 값을 배열로 반환한다', () => {
    const result = getBlockValues(blocks, 'content');
    expect(result).toEqual([{ text: '오늘의 기록' }, { text: '두 번째 내용' }]);
  });

  it('타입이 1개만 있으면 요소 1개짜리 배열을 반환한다', () => {
    const result = getBlockValues(blocks, 'emotion');
    expect(result).toEqual([{ mood: '행복' }]);
  });

  it('존재하지 않는 타입이면 빈 배열을 반환한다', () => {
    expect(getBlockValues(blocks, 'location')).toEqual([]);
  });

  it('블록 배열이 비어 있으면 빈 배열을 반환한다', () => {
    expect(getBlockValues([], 'content')).toEqual([]);
  });
});

describe('getSingleBlockValue', () => {
  const record = { blocks } as unknown as RecordPreview;

  it('존재하는 타입의 블록 값을 반환한다', () => {
    expect(
      getSingleBlockValue<{ mood: string }>(record, 'emotion'),
    ).toEqual({ mood: '행복' });
  });

  it('존재하지 않는 타입이면 undefined를 반환한다', () => {
    expect(getSingleBlockValue(record, 'location')).toBeUndefined();
  });
});
