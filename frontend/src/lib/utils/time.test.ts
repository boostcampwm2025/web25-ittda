import { describe, it, expect } from 'vitest';
import { convertTo12Hour, convertTo24Hour, getPastDate } from './time';

describe('convertTo12Hour', () => {
  it('오전 시간을 변환한다', () => {
    expect(convertTo12Hour('09:30')).toBe('오전 9:30');
  });

  it('오후 시간을 변환한다', () => {
    expect(convertTo12Hour('23:23')).toBe('오후 11:23');
  });

  it('자정(00:00)은 오전 12시로 변환한다', () => {
    expect(convertTo12Hour('00:15')).toBe('오전 12:15');
  });

  it('정오(12:00)는 오후 12시로 변환한다', () => {
    expect(convertTo12Hour('12:00')).toBe('오후 12:00');
  });

  it('정오 이후(12:30)는 오후 12시로 변환한다', () => {
    expect(convertTo12Hour('12:30')).toBe('오후 12:30');
  });

  it('빈 문자열이면 그대로 반환한다', () => {
    expect(convertTo12Hour('')).toBe('');
  });

  it('콜론이 없는 잘못된 형식이면 그대로 반환한다', () => {
    expect(convertTo12Hour('1230')).toBe('1230');
  });
});

describe('convertTo24Hour', () => {
  it('오전 시간을 변환한다', () => {
    expect(convertTo24Hour('오전 9:30')).toBe('09:30');
  });

  it('오후 시간을 변환한다', () => {
    expect(convertTo24Hour('오후 11:23')).toBe('23:23');
  });

  it('오전 12시는 00시로 변환한다', () => {
    expect(convertTo24Hour('오전 12:05')).toBe('00:05');
  });

  it('오후 12시는 12시로 변환한다', () => {
    expect(convertTo24Hour('오후 12:00')).toBe('12:00');
  });

  it('이미 24시간 형식이면 그대로 반환한다', () => {
    expect(convertTo24Hour('23:30')).toBe('23:30');
  });

  it('한 자리 시간도 0 패딩하여 반환한다', () => {
    expect(convertTo24Hour('9:05')).toBe('09:05');
  });

  it('12시간/24시간 형식이 아닌 문자열은 그대로 반환한다', () => {
    expect(convertTo24Hour('invalid')).toBe('invalid');
  });
});

describe('convertTo12Hour → convertTo24Hour 왕복 변환', () => {
  const times = ['00:00', '00:30', '09:15', '12:00', '12:30', '23:59'];

  times.forEach((time) => {
    it(`${time}은 12시간 변환 후 다시 24시간으로 복원된다`, () => {
      expect(convertTo24Hour(convertTo12Hour(time))).toBe(time);
    });
  });
});

describe('getPastDate', () => {
  it('1일 전 날짜를 반환한다', () => {
    expect(getPastDate('2024-03-15', 1)).toBe('2024-03-14');
  });

  it('월 경계를 넘어서 계산한다', () => {
    expect(getPastDate('2024-03-01', 1)).toBe('2024-02-29'); // 2024년은 윤년
  });

  it('연도 경계를 넘어서 계산한다', () => {
    expect(getPastDate('2024-01-01', 1)).toBe('2023-12-31');
  });

  it('0일 전이면 같은 날짜를 반환한다', () => {
    expect(getPastDate('2024-06-15', 0)).toBe('2024-06-15');
  });
});
