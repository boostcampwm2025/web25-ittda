import { BadRequestException } from '@nestjs/common';

export function normalizeTags(tags?: string[]): string[] | undefined {
  if (!tags) return undefined;

  // 빈 문자열 제거 및 앞뒤 공백 제거
  // ! 태그 원본이 훼손될 여지 있음
  const cleaned = tags
    .map((t) => (typeof t === 'string' ? t.trim() : ''))
    .filter((t) => t.length > 0);

  // 중복 제거(순서 유지)
  const uniq: string[] = [];
  const seen = new Set<string>();
  for (const t of cleaned) {
    if (!seen.has(t)) {
      seen.add(t);
      uniq.push(t);
    }
  }

  if (uniq.length > 10) {
    throw new BadRequestException(`tags must be <= 10 (got ${uniq.length})`);
  }
  return uniq.length ? uniq : undefined;
}
