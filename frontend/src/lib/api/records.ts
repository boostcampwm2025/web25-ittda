import { cache } from 'react';
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { get } from './api';
import { RecordBlock, RecordDetailResponse } from '../types/record';
import {
  MapListResponse,
  PaginatedRecordPreviewResponse,
  RecordPreview,
} from '../types/recordResponse';
import { createApiError } from '../utils/errorHandler';
import { PERSONAL_STALE_TIME } from '../constants/constants';

// ============================================
// 서버 컴포넌트용 캐시된 함수 (React cache)
// ============================================

/**
 * 서버 컴포넌트에서 사용하는 캐시된 기록 상세 조회
 * 같은 요청 내에서 중복 호출 방지
 */
export const getCachedRecordDetail = cache(
  async (recordId: string, groupId?: string) => {
    const endpoint = groupId
      ? `/api/posts/${recordId}?groupId=${groupId}`
      : `/api/posts/${recordId}`;
    const response = await get<RecordDetailResponse>(endpoint);
    if (!response.success) {
      throw createApiError(response);
    }
    return response.data;
  },
);

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
  infiniteQueryOptions({
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
    queryFn: async ({ pageParam }) => {
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
      if (pageParam) params.cursor = pageParam;
      if (limit !== undefined) params.limit = limit;
      if (emotions) params.emotions = emotions;

      const response = await get<MapListResponse>(`/api/map/posts`, params);

      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => {
      if (!lastPage || !lastPage.hasNextPage) return undefined;
      return lastPage.hasNextPage ? lastPage.nextCursor : undefined;
    },
    staleTime: PERSONAL_STALE_TIME,
    retry: false,
  });

export const recordDetailOptions = (recordId: string, groupId?: string) =>
  queryOptions({
    queryKey: groupId
      ? ['record', recordId, groupId]
      : ['record', recordId],
    queryFn: async () => {
      const endpoint = groupId
        ? `/api/posts/${recordId}?groupId=${groupId}`
        : `/api/posts/${recordId}`;
      const response = await get<RecordDetailResponse>(endpoint);

      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
    staleTime: 0,
    retry: false,
  });

export const recordPreviewListOptions = (
  date: string,
  scope?: 'groups' | 'personal',
  groupId?: string,
) =>
  queryOptions({
    queryKey: (() => {
      if (scope === 'groups')
        return ['group', groupId, 'records', 'daily', date];
      if (scope === 'personal')
        return ['my', 'records', 'preview', date, 'personal'];
      return ['my', 'records', 'preview', date];
    })(),
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

// 홈에 오늘 기록이 없을 때 보여줄 "지난 기록" 무한스크롤 피드.
export const pastFeedInfiniteOptions = (groupId?: string) =>
  infiniteQueryOptions({
    queryKey: groupId
      ? ['group', groupId, 'records', 'past']
      : ['my', 'records', 'past'],
    queryFn: async ({ pageParam }) => {
      const endpoint = groupId
        ? `/api/feed/groups/${groupId}/past`
        : '/api/feed/past';
      const query = pageParam ? `?cursor=${encodeURIComponent(pageParam)}` : '';

      const response = await get<PaginatedRecordPreviewResponse>(
        `${endpoint}${query}`,
      );
      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
  });

export interface PostGroupShare {
  groupId: string;
  groupName: string;
  sharedAt: string;
}

// 이 개인 글이 공유된 그룹 목록 조회 (원작성자만 조회 가능)
export const postGroupShareOptions = (postId: string) =>
  queryOptions({
    queryKey: ['posts', postId, 'group-shares'],
    queryFn: async () => {
      const res = await get<PostGroupShare[]>(
        `/api/posts/${postId}/group-shares`,
      );
      if (!res.success) throw createApiError(res);
      return res.data;
    },
    // 비소유자는 UI에서 이 조회 자체를 트리거하지 않도록 막아뒀다 —
    // 혹시 실패해도 원문 영어 메시지를 그대로 토스트로 띄우지 않는다.
    meta: { silent: true },
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
