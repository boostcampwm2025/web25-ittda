import { queryOptions } from '@tanstack/react-query';
import { EmotionStatSummary, TagStatSummary } from '../types/profile';
import {
  RecordPatternResponse,
  UserProfileResponse,
} from '../types/profileResponse';
import { createApiError } from '../utils/errorHandler';
import { get } from './api';
import { getCachedData, CACHE_TAGS } from './cache';
import { PERSONAL_STALE_TIME } from '../constants/constants';

// ============================================
// 서버 컴포넌트용 캐시된 함수 (unstable_cache)
// ============================================

/**
 * 서버 컴포넌트에서 사용하는 캐시된 프로필 조회
 */
export async function getCachedUserProfile() {
  return getCachedData<UserProfileResponse>(
    async () => {
      const response = await get<UserProfileResponse>('/api/me');
      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
    ['profile', 'me'],
    [CACHE_TAGS.PROFILE],
  );
}

/**
 * 서버 컴포넌트에서 사용하는 캐시된 태그 통계 조회
 */
export async function getCachedUserTagSummary() {
  return getCachedData<TagStatSummary>(
    async () => {
      const response = await get<TagStatSummary>('/api/me/tags/stats?limit=10');
      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
    ['profile', 'tags', 'summary'],
    [CACHE_TAGS.TAGS_SUMMARY],
  );
}

/**
 * 서버 컴포넌트에서 사용하는 캐시된 감정 통계 조회
 */
export async function getCachedUserEmotionSummary() {
  return getCachedData<EmotionStatSummary>(
    async () => {
      const response = await get<EmotionStatSummary>(
        '/api/me/emotions/stats?limit=7',
      );
      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
    ['profile', 'emotions', 'summary'],
    [CACHE_TAGS.EMOTIONS_SUMMARY],
  );
}

/**
 * 서버 컴포넌트에서 사용하는 캐시된 기록 통계 조회
 * @param month - YYYY-MM-DD 형식이면 연속 작성 일수, YYYY-MM 형식이면 월간 기록 수
 */
export async function getCachedUserRecordStats(
  type: 'date' | 'month',
  value: string,
) {
  return getCachedData<RecordPatternResponse>(
    async () => {
      const endpoint =
        type === 'date'
          ? `/api/me/stats/summary?date=${value}`
          : `/api/me/stats/summary?month=${value}`;
      const response = await get<RecordPatternResponse>(endpoint);
      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
    ['stats', 'summary', value],
    [CACHE_TAGS.RECORD_STATS],
  );
}

// ============================================
// 클라이언트 컴포넌트용 queryOptions (React Query)
// ============================================

export const userProfileOptions = () =>
  queryOptions({
    queryKey: ['profile', 'me'],
    queryFn: async () => {
      const response = await get<UserProfileResponse>('/api/me');

      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
    staleTime: PERSONAL_STALE_TIME,
    retry: false,
  });

export const userProfileTagSummaryOptions = () =>
  queryOptions({
    queryKey: ['profile', 'tags', 'summary'],
    queryFn: async () => {
      const response = await get<TagStatSummary>('/api/me/tags/stats?limit=10');

      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
    staleTime: PERSONAL_STALE_TIME,
    retry: false,
  });

export const userProfileEmotionSummaryOptions = () =>
  queryOptions({
    queryKey: ['profile', 'emotions', 'summary'],
    queryFn: async () => {
      const response = await get<EmotionStatSummary>(
        '/api/me/emotions/stats?limit=7',
      );

      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
    staleTime: PERSONAL_STALE_TIME,
    retry: false,
  });

export const userRecordPatternOptions = (month: string) =>
  queryOptions({
    queryKey: ['pattern'],
    queryFn: async () => {
      const response = await get<RecordPatternResponse>(
        `/v1/me/stats/summary?month=${month}`,
      );

      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
    staleTime: PERSONAL_STALE_TIME,
    retry: false,
  });
