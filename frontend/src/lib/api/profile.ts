import { cache } from 'react';
import { queryOptions } from '@tanstack/react-query';
import { Emotion, TagStatSummary } from '../types/profile';
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
export const getCachedUserTagSummary = cache(async (limit?: number) => {
  const endpoint = limit ? `/api/stats/tags?limit=${limit}` : '/api/stats/tags';
  const response = await get<TagStatSummary>(endpoint);
  if (!response.success) {
    throw createApiError(response);
  }
  return response.data;
});

/**
 * 서버 컴포넌트에서 사용하는 캐시된 감정 통계 조회
 */
export const getCachedUserEmotionSummary = cache(async (limit?: number) => {
  const endpoint = limit
    ? `/api/stats/emotions?limit=${limit}`
    : '/api/stats/emotions';
  const response = await get<Emotion[]>(endpoint);
  if (!response.success) {
    throw createApiError(response);
  }
  return {
    emotion: response.data,
    totalCount: Number(response.meta?.totalCount),
  };
});

/**
 * 서버 컴포넌트에서 사용하는 캐시된 기록 통계 조회
 */
export const getCachedUserRecordStats = cache(async () => {
  const response = await get<RecordPatternResponse>(
    '/api/stats/summary',
    undefined,
    {
      next: { tags: ['stats-summary'] },
    },
  );
  if (!response.success) {
    throw createApiError(response);
  }
  return response.data;
});

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

export const userProfileTagSummaryOptions = (limit?: number) =>
  queryOptions({
    queryKey: limit
      ? ['profile', 'tags', 'summary', limit]
      : ['profile', 'tags', 'summary'],
    queryFn: async () => {
      const endpoint = limit
        ? `/api/stats/tags?limit=${limit}`
        : '/api/stats/tags';
      const response = await get<TagStatSummary>(endpoint);

      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
    staleTime: PERSONAL_STALE_TIME,
    retry: false,
  });

export const userProfileEmotionSummaryOptions = (limit?: number) =>
  queryOptions({
    queryKey: limit
      ? ['profile', 'emotions', 'summary', limit]
      : ['profile', 'emotions', 'summary'],
    queryFn: async () => {
      const endpoint = limit
        ? `/api/stats/emotions?limit=${limit}`
        : '/api/stats/emotions';
      const response = await get<Emotion[]>(endpoint);

      if (!response.success) {
        throw createApiError(response);
      }
      return {
        emotion: response.data,
        totalCount: Number(response.meta?.totalCount),
      };
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
