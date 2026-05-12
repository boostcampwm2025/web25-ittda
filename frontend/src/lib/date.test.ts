import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  formatRelativeTime,
  getMonthRange,
  getWeekDays,
  getStartOfWeek,
  formatDateISO,
  parseLocalDate,
  formatDotDateString,
  getWeekdayFromDotString,
} from './date';

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('60초 미만이면 "방금 전" 반환', () => {
    const date = new Date('2024-06-15T11:59:10');
    expect(formatRelativeTime(date)).toBe('방금 전');
  });

  it('1분~59분이면 "N분 전" 반환', () => {
    const date = new Date('2024-06-15T11:55:00');
    expect(formatRelativeTime(date)).toBe('5분 전');
  });

  it('1시간~23시간이면 "N시간 전" 반환', () => {
    const date = new Date('2024-06-15T09:00:00');
    expect(formatRelativeTime(date)).toBe('3시간 전');
  });

  it('정확히 1일 전이면 "어제" 반환', () => {
    const date = new Date('2024-06-14T12:00:00');
    expect(formatRelativeTime(date)).toBe('어제');
  });

  it('2일~29일이면 "N일 전" 반환', () => {
    const date = new Date('2024-06-10T12:00:00');
    expect(formatRelativeTime(date)).toBe('5일 전');
  });

  it('1개월~11개월이면 "N개월 전" 반환', () => {
    const date = new Date('2024-03-15T12:00:00');
    expect(formatRelativeTime(date)).toBe('3개월 전');
  });

  it('12개월 이상이면 "N년 전" 반환', () => {
    const date = new Date('2023-06-15T12:00:00');
    expect(formatRelativeTime(date)).toBe('1년 전');
  });
});

describe('getMonthRange', () => {
  it('일반 달의 시작일과 종료일을 반환한다', () => {
    expect(getMonthRange('2024-03')).toEqual({
      startDate: '2024-03-01',
      endDate: '2024-03-31',
    });
  });

  it('윤년 2월의 마지막 날은 29일이다', () => {
    expect(getMonthRange('2024-02')).toEqual({
      startDate: '2024-02-01',
      endDate: '2024-02-29',
    });
  });

  it('평년 2월의 마지막 날은 28일이다', () => {
    expect(getMonthRange('2023-02')).toEqual({
      startDate: '2023-02-01',
      endDate: '2023-02-28',
    });
  });

  it('30일짜리 달의 종료일은 30일이다', () => {
    expect(getMonthRange('2024-04')).toEqual({
      startDate: '2024-04-01',
      endDate: '2024-04-30',
    });
  });

  it('12월의 마지막 날은 31일이다', () => {
    expect(getMonthRange('2024-12')).toEqual({
      startDate: '2024-12-01',
      endDate: '2024-12-31',
    });
  });
});

describe('getStartOfWeek', () => {
  it('주의 시작은 일요일이다', () => {
    const wednesday = new Date('2024-06-12'); // 수요일
    const startOfWeek = getStartOfWeek(wednesday);
    expect(startOfWeek.getDay()).toBe(0); // 일요일
  });

  it('일요일을 입력하면 같은 날을 반환한다', () => {
    const sunday = new Date('2024-06-09');
    const startOfWeek = getStartOfWeek(sunday);
    expect(formatDateISO(startOfWeek)).toBe('2024-06-09');
  });

  it('시간을 00:00:00으로 초기화한다', () => {
    const date = new Date('2024-06-12T15:30:00');
    const startOfWeek = getStartOfWeek(date);
    expect(startOfWeek.getHours()).toBe(0);
    expect(startOfWeek.getMinutes()).toBe(0);
    expect(startOfWeek.getSeconds()).toBe(0);
  });
});

describe('getWeekDays', () => {
  it('7개의 요일을 반환한다', () => {
    const days = getWeekDays(new Date('2024-06-12'));
    expect(days).toHaveLength(7);
  });

  it('첫 번째 날은 일요일이다', () => {
    const days = getWeekDays(new Date('2024-06-12'));
    expect(days[0].dayName).toBe('일');
  });

  it('마지막 날은 토요일이다', () => {
    const days = getWeekDays(new Date('2024-06-12'));
    expect(days[6].dayName).toBe('토');
  });

  it('오늘 날짜에 isToday가 true다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-12'));
    const days = getWeekDays(new Date('2024-06-12'));
    const today = days.find((d) => d.isToday);
    expect(today).toBeDefined();
    expect(today?.dateStr).toBe('2024-06-12');
    vi.useRealTimers();
  });
});

describe('parseLocalDate', () => {
  it('YYYY-MM-DD 문자열을 로컬 Date로 변환한다', () => {
    const date = parseLocalDate('2024-06-15');
    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(5); // 0-indexed
    expect(date.getDate()).toBe(15);
  });

  it('UTC 해석 없이 로컬 자정을 반환한다', () => {
    const date = parseLocalDate('2024-01-01');
    expect(date.getHours()).toBe(0);
    expect(date.getMinutes()).toBe(0);
  });
});

describe('formatDotDateString', () => {
  it('ISO 날짜 문자열을 YYYY.MM.DD로 변환한다', () => {
    expect(formatDotDateString('2025-12-20T20:00:00Z')).toBe('2025.12.20');
  });

  it('날짜만 있는 문자열도 변환한다', () => {
    expect(formatDotDateString('2025-12-21')).toBe('2025.12.21');
  });
});

describe('getWeekdayFromDotString', () => {
  it('수요일 날짜 문자열에서 "수"를 반환한다', () => {
    expect(getWeekdayFromDotString('2024.06.12')).toBe('수');
  });

  it('일요일 날짜 문자열에서 "일"을 반환한다', () => {
    expect(getWeekdayFromDotString('2024.06.09')).toBe('일');
  });
});
