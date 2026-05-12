import { describe, it, expect } from 'vitest';
import {
  makeTagLabel,
  makeEmotionLabel,
  makeDateLabel,
  makeLocationLabel,
} from './filterLabels';

describe('makeTagLabel', () => {
  it('태그가 없으면 "태그" 반환', () => {
    expect(makeTagLabel([])).toBe('태그');
  });

  it('태그가 1개이면 태그명 그대로 반환', () => {
    expect(makeTagLabel(['여행'])).toBe('여행');
  });

  it('태그가 2개이면 "첫번째 외 1" 반환', () => {
    expect(makeTagLabel(['여행', '맛집'])).toBe('여행 외 1');
  });

  it('태그가 3개 이상이면 "첫번째 외 N" 반환', () => {
    expect(makeTagLabel(['여행', '맛집', '카페'])).toBe('여행 외 2');
  });
});

describe('makeEmotionLabel', () => {
  it('감정이 없으면 "감정" 반환', () => {
    expect(makeEmotionLabel([])).toBe('감정');
  });

  it('감정이 1개이면 감정명 그대로 반환', () => {
    expect(makeEmotionLabel(['행복'])).toBe('행복');
  });

  it('감정이 2개 이상이면 "첫번째 외 N" 반환', () => {
    expect(makeEmotionLabel(['행복', '설렘', '평온'])).toBe('행복 외 2');
  });
});

describe('makeDateLabel', () => {
  it('start, end 모두 없으면 "날짜" 반환', () => {
    expect(makeDateLabel()).toBe('날짜');
  });

  it('start, end 모두 null이면 "날짜" 반환', () => {
    expect(makeDateLabel(null, null)).toBe('날짜');
  });

  it('start만 있으면 start 반환', () => {
    expect(makeDateLabel('2024-01-01')).toBe('2024-01-01');
  });

  it('end만 있으면 end 반환', () => {
    expect(makeDateLabel(null, '2024-12-31')).toBe('2024-12-31');
  });

  it('start, end 모두 있으면 "start ~ end" 반환', () => {
    expect(makeDateLabel('2024-01-01', '2024-12-31')).toBe(
      '2024-01-01 ~ 2024-12-31',
    );
  });
});

describe('makeLocationLabel', () => {
  it('주소가 없으면 "장소" 반환', () => {
    expect(makeLocationLabel()).toBe('장소');
  });

  it('주소가 null이면 "장소" 반환', () => {
    expect(makeLocationLabel(null)).toBe('장소');
  });

  it('주소가 있으면 주소 그대로 반환', () => {
    expect(makeLocationLabel('서울특별시 강남구')).toBe('서울특별시 강남구');
  });
});
