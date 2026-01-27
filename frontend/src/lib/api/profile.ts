import { cache } from 'react';
import { queryOptions } from '@tanstack/react-query';
import { EmotionStatSummary, TagStatSummary } from '../types/profile';
import {
  RecordPatternResponse,
  UserProfileResponse,
} from '../types/profileResponse';
import { createApiError } from '../utils/errorHandler';
import { get } from './api';
import { PERSONAL_STALE_TIME } from '../constants/constants';

// ============================================
// 서버 컴포넌트용 캐시된 함수 (React cache)
// ============================================

/**
 * 서버 컴포넌트에서 사용하는 캐시된 프로필 조회
 * 같은 요청 내에서 중복 호출 방지
 */
export const getCachedUserProfile = cache(async () => {
  const response = await get<UserProfileResponse>('/api/me');
  if (!response.success) {
    throw createApiError(response);
  }
  return response.data;
});

/**
 * 서버 컴포넌트에서 사용하는 캐시된 태그 통계 조회
 */
export const getCachedUserTagSummary = cache(async () => {
  const response = await get<TagStatSummary>('/api/me/tags/stats?limit=10');
  if (!response.success) {
    throw createApiError(response);
  }
  return response.data;
});

/**
 * 서버 컴포넌트에서 사용하는 캐시된 감정 통계 조회
 */
export const getCachedUserEmotionSummary = cache(async () => {
  const response = await get<EmotionStatSummary>(
    '/api/me/emotions/stats?limit=7',
  );
  if (!response.success) {
    throw createApiError(response);
  }
  return response.data;
});

/**
 * 서버 컴포넌트에서 사용하는 캐시된 기록 통계 조회
 * @param type - 'date': 연속 작성 일수, 'month': 월간 기록 수
 * @param value - YYYY-MM-DD 또는 YYYY-MM 형식
 */
export const getCachedUserRecordStats = cache(
  async (type: 'date' | 'month', value: string) => {
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
);

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
      const response = await get<TagStatSummary>('/api/stats/tags?limit=10');

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
        '/api/stats/emotions?limit=7',
      );

      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
    staleTime: PERSONAL_STALE_TIME,
    retry: false,
  });

export const userRecordPatternOptions = () =>
  queryOptions({
    queryKey: ['pattern'],
    queryFn: async () => {
      const response = await get<RecordPatternResponse>('/api/stats/summary');

      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
    staleTime: PERSONAL_STALE_TIME,
    retry: false,
  });
