'use server';

import { updateTag } from 'next/cache';
import { CACHE_TAGS, CacheTag } from './cache';

/**
 * 서버 캐시 무효화 Server Action
 * 클라이언트에서 mutation 성공 시 호출하여 서버 캐시를 무효화
 */

/**
 * 특정 태그의 캐시 무효화
 */
export async function invalidateCache(tag: CacheTag) {
  updateTag(tag);
}

/**
 * 여러 태그의 캐시 무효화
 */
export async function invalidateCaches(tags: CacheTag[]) {
  tags.forEach((tag) => updateTag(tag));
}

/**
 * 프로필 관련 캐시 무효화
 * - 프로필 수정 시 호출
 */
export async function invalidateProfileCache() {
  updateTag(CACHE_TAGS.PROFILE);
}

/**
 * 기록 관련 캐시 무효화
 * - 기록 생성/수정/삭제 시 호출
 */
export async function invalidateRecordsCache() {
  updateTag(CACHE_TAGS.RECORDS);
}

/**
 * 통계 관련 캐시 무효화
 * - 기록 생성/수정/삭제 시 함께 호출 (태그/감정/기록 통계 변경)
 */
export async function invalidateStatsCache() {
  updateTag(CACHE_TAGS.TAGS_SUMMARY);
  updateTag(CACHE_TAGS.EMOTIONS_SUMMARY);
  updateTag(CACHE_TAGS.RECORD_STATS);
}

/**
 * 개인 영역 전체 캐시 무효화
 * - 기록 생성/수정/삭제 시 호출
 */
export async function invalidatePersonalCache() {
  updateTag(CACHE_TAGS.PROFILE);
  updateTag(CACHE_TAGS.RECORDS);
  updateTag(CACHE_TAGS.RECORD_STATS);
  updateTag(CACHE_TAGS.TAGS_SUMMARY);
  updateTag(CACHE_TAGS.EMOTIONS_SUMMARY);
}
