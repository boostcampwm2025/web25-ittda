import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  formatDate,
  formatTime,
  formatDateTime,
  formatTimeStr,
  formatRelativeTime,
  formatDateDot,
  getDateMetadata,
  getMonthRange,
  getWeekDays,
  getStartOfWeek,
  formatDateISO,
  parseLocalDate,
  formatDotDateString,
  getWeekdayFromDotString,
} from './date';

describe('formatDate', () => {
  it('날짜를 "N년 N월 N일" 형식으로 반환한다', () => {
    expect(formatDate(new Date('2024-06-15T12:00:00'))).toBe('2024년 6월 15일');
  });

  it('인자가 없으면 현재 날짜를 사용한다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00'));

    expect(formatDate()).toBe('2024년 6월 15일');

    vi.useRealTimers();
  });
});

describe('formatTime', () => {
  it('낮 시간을 "오후 HH:mm" 형식으로 반환한다', () => {
    expect(formatTime(new Date('2024-06-15T12:00:00+09:00'))).toBe(
      '오후 12:00',
    );
  });

  it('오전 시간을 "오전 HH:mm" 형식으로 반환한다', () => {
    expect(formatTime(new Date('2024-06-15T09:05:00+09:00'))).toBe(
      '오전 09:05',
    );
  });

  it('인자가 없으면 현재 시간을 사용한다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T09:05:00+09:00'));

    expect(formatTime()).toBe('오전 09:05');

    vi.useRealTimers();
  });
});

describe('formatDateTime', () => {
  it('날짜와 시간을 함께 담은 객체를 반환한다', () => {
    expect(formatDateTime(new Date('2024-06-15T09:05:00+09:00'))).toEqual({
      timeZone: 'Asia/Seoul',
      date: '2024년 6월 15일',
      time: '오전 09:05',
    });
  });
});

describe('formatTimeStr', () => {
  it('오전 시간을 "오전 HH:mm" 형식으로 변환한다', () => {
    expect(formatTimeStr('09:05')).toBe('오전 09:05');
  });

  it('오후 시간을 "오후 HH:mm" 형식으로 변환한다', () => {
    expect(formatTimeStr('13:30')).toBe('오후 01:30');
  });

  it('자정(00:00)은 "오전 12:00"으로 변환한다', () => {
    expect(formatTimeStr('00:00')).toBe('오전 12:00');
  });

  it('정오(12:00)는 "오후 12:00"으로 변환한다', () => {
    expect(formatTimeStr('12:00')).toBe('오후 12:00');
  });

  it('시간 형식이 잘못되면 입력값을 그대로 반환한다', () => {
    expect(formatTimeStr('abc:def')).toBe('abc:def');
  });
});

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

  it('정확히 1일 전이면 "하루 전" 반환', () => {
    const date = new Date('2024-06-14T12:00:00');
    expect(formatRelativeTime(date)).toBe('하루 전');
  });

  it('2일~29일이면 "N일 전" 반환', () => {
    const date = new Date('2024-06-10T12:00:00');
    expect(formatRelativeTime(date)).toBe('5일 전');
  });

  it('1개월이면 "한 달 전" 반환', () => {
    const date = new Date('2024-05-15T12:00:00');
    expect(formatRelativeTime(date)).toBe('한 달 전');
  });

  it('2개월이면 "두 달 전" 반환', () => {
    const date = new Date('2024-04-15T12:00:00');
    expect(formatRelativeTime(date)).toBe('두 달 전');
  });

  it('3개월~11개월이면 "N달 전" 반환', () => {
    const date = new Date('2024-03-15T12:00:00');
    expect(formatRelativeTime(date)).toBe('3달 전');
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

describe('formatDateDot', () => {
  it('날짜를 "YYYY.MM.DD" 형식으로 반환한다', () => {
    expect(formatDateDot(new Date(2024, 5, 15))).toBe('2024.06.15');
  });

  it('한 자리 월/일은 0으로 채운다', () => {
    expect(formatDateDot(new Date(2024, 0, 5))).toBe('2024.01.05');
  });

  it('인자가 없으면 현재 날짜를 사용한다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 5, 15));

    expect(formatDateDot()).toBe('2024.06.15');

    vi.useRealTimers();
  });
});

describe('getDateMetadata', () => {
  it('날짜, 시간, 요일 정보를 담은 객체를 반환한다', () => {
    const date = new Date('2024-06-12T09:05:00'); // 수요일
    const metadata = getDateMetadata(date);

    expect(metadata.date).toBe(formatDateISO(date));
    expect(metadata.time).toBe(
      `${String(date.getHours()).padStart(2, '0')}:${String(
        date.getMinutes(),
      ).padStart(2, '0')}`,
    );
    expect(metadata.weekday).toBe('수요일');
  });

  it('인자가 없으면 현재 날짜를 사용한다', () => {
    vi.useFakeTimers();
    const now = new Date('2024-06-09T00:00:00'); // 일요일
    vi.setSystemTime(now);

    const metadata = getDateMetadata();
    expect(metadata.weekday).toBe('일요일');

    vi.useRealTimers();
  });
});
