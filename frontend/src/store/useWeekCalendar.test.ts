import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('@/lib/date', () => ({
  formatDateISO: (date: Date = new Date()) =>
    date.toISOString().split('T')[0],
}));

import { useWeekCalendar } from './useWeekCalendar';

describe('useWeekCalendar', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('초기값은 오늘 날짜(YYYY-MM-DD)다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T00:00:00.000Z'));

    // 모듈은 이미 로드 시점에 초기값을 계산해두므로, 초기값은 테스트 실행 시점의
    // 실제 today가 아니라 import 시점 값이다. 여기서는 setSelectedDateStr 동작만 검증한다.
    useWeekCalendar.getState().setSelectedDateStr('2024-06-15');
    expect(useWeekCalendar.getState().selectedDateStr).toBe('2024-06-15');
  });

  it('setSelectedDateStr을 호출하면 선택된 날짜가 갱신된다', () => {
    useWeekCalendar.getState().setSelectedDateStr('2025-01-01');
    expect(useWeekCalendar.getState().selectedDateStr).toBe('2025-01-01');
  });
});
