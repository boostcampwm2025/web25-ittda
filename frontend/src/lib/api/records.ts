import { cache } from 'react';
import { queryOptions } from '@tanstack/react-query';
import { get } from './api';
import { RecordBlock, RecordDetailResponse } from '../types/record';
import { MapListResponse, RecordPreview } from '../types/recordResponse';
import { createApiError } from '../utils/errorHandler';
import { PERSONAL_STALE_TIME } from '../constants/constants';

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
  return response.data;
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

export interface MapRecordListParams {
  maxLat: number;
  maxLng: number;
  minLat: number;
  minLng: number;
  scope: 'personal' | 'group';
  emotions?: string;
  groupId?: string;
  radius?: number;
  from?: string;
  to?: string;
  tags?: string;
  cursor?: string;
  limit?: number;
}

export const mapRecordListOptions = ({
  maxLat,
  maxLng,
  minLat,
  minLng,
  scope,
  groupId,
  radius,
  from,
  emotions,
  to,
  tags,
  cursor,
  limit,
}: MapRecordListParams) =>
  queryOptions({
    queryKey: [
      'map',
      'records',
      scope,
      ...(scope === 'group' && groupId ? [groupId] : []),
      maxLat,
      maxLng,
      minLat,
      minLng,
      radius,
      from,
      to,
      tags,
      cursor,
      limit,
      emotions,
    ],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        maxLat,
        maxLng,
        minLat,
        minLng,
        scope,
      };

      if (scope === 'group' && groupId) {
        params.groupId = groupId;
      }
      if (radius !== undefined) params.radius = radius;
      if (from) params.from = from;
      if (to) params.to = to;
      if (tags) params.tags = tags;
      if (cursor) params.cursor = cursor;
      if (limit !== undefined) params.limit = limit;
      if (emotions) params.emotions = emotions;

      const response = await get<MapListResponse>(`/api/map/posts`, params);

      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
    staleTime: PERSONAL_STALE_TIME,
    retry: false,
  });

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

export interface PersonalEditResponse {
  title: string;
  thumbnailMediaId: string;
  blocks: RecordBlock[];
}
// 개인 게시글 수정 스냅샷 조회
export const personalEditOptions = (postId: string) =>
  queryOptions({
    queryKey: ['posts', postId, 'edit'],
    queryFn: async () => {
      const res = await get<PersonalEditResponse>(`/api/posts/${postId}/edit`);
      if (!res.success) throw createApiError(res);
      if (!res.success) {
        throw createApiError(res);
      }
      return res.data;
    },
    retry: 2,
    enabled: !!postId,
  });
