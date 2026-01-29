import { BadRequestException } from '@nestjs/common';

/**
 * YYYY-MM 형식의 문자열을 year, month로 파싱
 */
export function parseYearMonth(yyyy_mm: string) {
  const [yearStr, monthStr] = yyyy_mm.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    throw new BadRequestException('Invalid date format. Use YYYY-MM.');
  }

  return { year, month };
}

/**
 * YYYY-MM-DD 또는 YYYY-MM 형식을 검증하고 파싱합니다.
 * @param dateStr "2024-02-29" 또는 "2024-04-31" 등
 */
export function parseAndValidateDate(dateStr: string) {
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parts[2] ? parseInt(parts[2], 10) : 1; // 일자 없으면 1일로 가정

  // 1. 기본적인 숫자 여부 및 월 범위 확인
  if (
    isNaN(year) ||
    isNaN(month) ||
    month < 1 ||
    month > 12 ||
    isNaN(day) ||
    day < 1
  ) {
    throw new BadRequestException('Invalid date format.');
  }

  // 2. 실제 존재하지 않는 날짜 검증 (핵심 로직)
  // Month는 0-indexed이므로 1을 뺍니다.
  const date = new Date(year, month - 1, day);

  // 입력된 값과 생성된 Date 객체의 값이 다르면 유효하지 않은 날짜임
  // 예: 2023-02-29 입력 시 date 객체는 2023-03-01로 변환됨
  if (
    date.getFullYear() !== year ||
    date.getMonth() + 1 !== month ||
    date.getDate() !== day
  ) {
    throw new BadRequestException(`The date ${dateStr} does not exist.`);
  }

  return { year, month, day };
}
