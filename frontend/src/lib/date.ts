/**
 * 날짜를 한국어 형식으로 포맷팅
 * @param date - 포맷팅할 날짜 (기본값: 현재 날짜)
 * @returns "2025년 1월 14일" 형식의 문자열
 * @example
 * formatDate() // "2025년 1월 14일"
 * formatDate(new Date('2024-12-25')) // "2024년 12월 25일"
 */
export function formatDate(date: Date = new Date()): string {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * 시간을 한국어 형식으로 포맷팅
 * @param date - 포맷팅할 날짜 (기본값: 현재 시간)
 * @returns "오후 09:36" 형식의 문자열
 * @example
 * formatTime() // "오후 02:30"
 * formatTime(new Date('2024-12-25 14:30')) // "오후 02:30"
 */
export function formatTime(date: Date = new Date()): string {
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 날짜와 시간을 함께 포맷팅
 * @param date - 포맷팅할 날짜 (기본값: 현재 날짜/시간)
 * @returns 날짜와 시간을 포함하는 객체
 * @example
 * formatDateTime() // { date: "2025년 1월 14일", time: "오후 09:36" }
 */
export function formatDateTime(date: Date = new Date()) {
  return {
    date: formatDate(date),
    time: formatTime(date),
  };
}

/**
 * 날짜를 상대적인 시간으로 표시
 * @param date - 비교할 날짜
 * @returns "방금 전", "5분 전", "어제", "3일 전" 등의 문자열
 * @example
 * formatRelativeTime(new Date()) // "방금 전"
 * formatRelativeTime(new Date(Date.now() - 1000 * 60 * 5)) // "5분 전"
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);

  if (seconds < 60) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days === 1) return '어제';
  if (days < 30) return `${days}일 전`;
  if (months < 12) return `${months}개월 전`;
  return `${years}년 전`;
}

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷팅합니다.
 * @param date - 포맷팅할 날짜 (기본값: 현재 날짜)
 * @returns "2025-01-14" 형식의 문자열
 * @example
 * formatDateISO() // "2025-01-14"
 */
export function formatDateISO(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}
