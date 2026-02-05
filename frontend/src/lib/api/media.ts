import { cache } from 'react';
import { get, post } from './api';
import {
  SingleResolveResponse,
  MultiResolveResponse,
} from '@/hooks/useMediaResolve';
import { createApiError } from '../utils/errorHandler';
import { logger } from '../utils/logger';

/**
 * 단건 미디어 URL 조회 (서버 컴포넌트용)
 */
export const getMediaUrlServer = cache(async (mediaId: string) => {
  const response = await get<SingleResolveResponse>(
    `/api/media/${mediaId}/url`,
  );
  if (!response.success) {
    throw createApiError(response);
  }
  return response.data?.url;
});

/**
 * 다중 미디어 URL 조회 (서버 컴포넌트용)
 * 여러 미디어 ID를 한 번에 조회하여 성능 최적화
 */
export const getMediaUrlsServer = cache(async (mediaIds: string[]) => {
  if (mediaIds.length === 0) return new Map<string, string>();

  try {
    const response = await post<MultiResolveResponse>('/api/media/resolve', {
      mediaIds,
    });

    if (!response.success || !response.data) {
      logger.error('Error resolving media URLs', response);
      return new Map<string, string>();
    }

    // Map으로 변환하여 빠른 조회 가능하도록
    const urlMap = new Map<string, string>();
    const items = response.data.items || [];
    items.forEach((item) => {
      if (item?.mediaId && item?.url) {
        urlMap.set(item.mediaId, item.url);
      }
    });

    return urlMap;
  } catch (error) {
    logger.error('Error resolving media URLs', error);
    return new Map<string, string>();
  }
});
