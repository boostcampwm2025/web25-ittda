import { cache } from 'react';
import { queryOptions } from '@tanstack/react-query';
import { get } from './api';
import { RecordDetailResponse } from '../types/record';
import { RecordPreview } from '../types/recordResponse';
import { createApiError } from '../utils/errorHandler';
import { PERSONAL_STALE_TIME } from '../constants/constants';
import { resolveMediaInBlocks } from '../utils/mediaResolver';

// ============================================
// 서버 컴포넌트용 캐시된 함수 (React cache)
// ============================================

/**
 * 서버 컴포넌트에서 사용하는 캐시된 기록 상세 조회
 * 같은 요청 내에서 중복 호출 방지
 */
export const getCachedRecordDetail = cache(async (recordId: string) => {
  const response = await get<RecordDetailResponse>(`/api/posts/${recordId}`);
  if (!response.success) {
    throw createApiError(response);
  }
  const record = response.data;

  record.blocks = await resolveMediaInBlocks(record.blocks);

  return record;
});

/**
 * 서버 컴포넌트에서 사용하는 캐시된 기록 프리뷰 목록 조회
 */
export const getCachedRecordPreviewList = cache(
  async (date: string, scope?: 'groups' | 'personal', groupId?: string) => {
    const endpoint = !scope
      ? `/api/feed?date=${date}`
      : groupId
        ? `/api/feed/${scope}/${groupId}?date=${date}`
        : `/api/feed/${scope}?date=${date}`;

    const response = await get<RecordPreview[]>(endpoint);
    if (!response.success) {
      throw createApiError(response);
    }
    return response.data;
  },
);

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
      const record = response.data;

      record.blocks = await resolveMediaInBlocks(record.blocks);

      return record;
    },
    staleTime: PERSONAL_STALE_TIME,
    retry: false,
  });

export const recordPreviewListOptions = (
  date: string,
  scope?: 'groups' | 'personal',
  groupId?: string,
) =>
  queryOptions({
    queryKey:
      scope === 'groups'
        ? ['group', groupId, 'records', 'daily', date]
        : ['records', 'preview', date, 'personal'],
    queryFn: async () => {
      const endpoint = !scope
        ? `/api/feed?date=${date}`
        : groupId
          ? `/api/feed/${scope}/${groupId}?date=${date}`
          : `/api/feed/${scope}?date=${date}`;

      const response = await get<RecordPreview[]>(endpoint);
      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
    staleTime: scope === 'personal' || !scope ? PERSONAL_STALE_TIME : 0,
    retry: false,
  });
