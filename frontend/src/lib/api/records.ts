import { queryOptions } from '@tanstack/react-query';
import { get } from './api';
import { RecordDetailResponse } from '../types/record';
import { RecordPreview } from '../types/recordResponse';
import { createApiError } from '../utils/errorHandler';
import { getCachedData, CACHE_TAGS } from './cache';
import { PERSONAL_STALE_TIME } from '../constants/constants';

// ============================================
// 서버 컴포넌트용 캐시된 함수 (unstable_cache)
// ============================================

/**
 * 서버 컴포넌트에서 사용하는 캐시된 기록 상세 조회
 */
export async function getCachedRecordDetail(recordId: string) {
  return getCachedData<RecordDetailResponse>(
    async () => {
      const response = await get<RecordDetailResponse>(
        `/api/posts/${recordId}`,
      );
      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
    ['record', recordId],
    [CACHE_TAGS.RECORDS, `record-${recordId}`],
  );
}

/**
 * 서버 컴포넌트에서 사용하는 캐시된 기록 프리뷰 목록 조회
 */
export async function getCachedRecordPreviewList(
  date: string,
  scope?: 'group' | 'personal',
  groupId?: string,
) {
  return getCachedData<RecordPreview[]>(
    async () => {
      const endpoint = scope
        ? `/api/feed?date=${date}&scope=${scope}`
        : `/api/feed?date=${date}`;

      const response = await get<RecordPreview[]>(endpoint);
      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
    groupId
      ? ['group', groupId, 'records', 'daily', date]
      : ['records', 'preview', date, ...(scope ? [scope] : [])],
    [
      CACHE_TAGS.RECORDS,
      `records-${date}`,
      ...(scope ? [`records-${scope}`] : []),
    ],
  );
}

// ============================================
// 클라이언트 컴포넌트용 queryOptions (React Query)
// ============================================

export const recordDetailOptions = (recordId: string) =>
  queryOptions({
    queryKey: ['record', recordId],
    queryFn: async () => {
      const response = await get<RecordDetailResponse>(
        `/api/posts/${recordId}`,
      );

      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
    staleTime: PERSONAL_STALE_TIME,
    retry: false,
  });

export const recordPreviewListOptions = (
  date: string,
  scope?: 'group' | 'personal',
  groupId?: string,
) =>
  queryOptions({
    queryKey:
      scope === 'group'
        ? ['group', groupId, 'records', 'daily', date]
        : ['records', 'preview', date, 'personal'],
    queryFn: async () => {
      const endpoint = scope
        ? `/api/feed?date=${date}&scope=${scope}`
        : `/api/feed?date=${date}`;

      const response = await get<RecordPreview[]>(endpoint);
      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
    staleTime: scope === 'personal' || !scope ? PERSONAL_STALE_TIME : 0,
    retry: false,
  });
