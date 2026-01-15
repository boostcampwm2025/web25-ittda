/**
 * 검색 시 필요한 필터링 라벨에 쓰이는 유틸
 */

export function makeTagLabel(tags: string[]) {
  if (tags.length === 0) return '태그';
  if (tags.length === 1) return tags[0];
  return `${tags[0]} 외 ${tags.length - 1}`;
}

export function makeEmotionLabel(emotions: string[]) {
  if (emotions.length === 0) return '감정';
  if (emotions.length === 1) return emotions[0];
  return `${emotions[0]} 외 ${emotions.length - 1}`;
}

export function makeDateLabel(start?: string | null, end?: string | null) {
  if (!start && !end) return '날짜';
  if (start && end) return `${start} ~ ${end}`;
  return start || end || '날짜';
}

export function makeLocationLabel(address?: string | null) {
  return address || '장소';
}
