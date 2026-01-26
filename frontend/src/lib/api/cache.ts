import { unstable_cache } from 'next/cache';
import { auth } from '@/auth';

/**
 * 사용자별 서버 사이드 캐시 유틸리티
 * - unstable_cache를 사용하여 서버에서 데이터 캐싱
 * - 사용자 ID를 캐시 키에 포함시켜 사용자별 캐시 분리
 * - 서버 컴포넌트에서만 사용
 */

// 기본 캐시 시간 (5분)
const DEFAULT_REVALIDATE = 60 * 5;

/**
 * 사용자별 캐시된 데이터 fetcher
 * @param fetcher - 실제 데이터를 가져오는 함수
 * @param keyParts - 캐시 키 구성 요소 (예: ['profile'], ['records', 'preview'])
 * @param tags - 캐시 태그 (revalidateTag로 무효화 시 사용)
 * @param revalidate - 재검증 시간 (초)
 */
export async function getCachedData<T>(
  fetcher: () => Promise<T>,
  keyParts: string[],
  tags: string[],
  revalidate: number = DEFAULT_REVALIDATE,
): Promise<T> {
  const session = await auth();
  const userId = session?.accessToken ? 'authenticated' : 'anonymous';

  // 사용자별 캐시 키 생성
  const cacheKey = [...keyParts, userId];

  // 사용자별 태그 추가
  const cacheTags = [...tags, `user-${userId}`];

  const cachedFetcher = unstable_cache(fetcher, cacheKey, {
    tags: cacheTags,
    revalidate,
  });

  return cachedFetcher();
}

/**
 * 캐시 태그 상수
 * revalidateTag()에서 사용
 */
export const CACHE_TAGS = {
  PROFILE: 'profile',
  RECORDS: 'records',
  SHARED: 'shared',
  RECORD_STATS: 'record-stats',
  TAGS_SUMMARY: 'tags-summary',
  EMOTIONS_SUMMARY: 'emotions-summary',
  MEMBER: 'member',
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];
