import { useQuery } from '@tanstack/react-query';
import { get, post } from '@/lib/api/api';
import { createApiError } from '@/lib/utils/errorHandler';

/** 단건 미디어 조회 응답 */
export interface SingleResolveResponse {
  url: string;
  expiresAt: string;
}

/** 다중 미디어 조회 응답 */
export interface MultiResolveItem {
  mediaId: string;
  url: string;
  expiresAt: string;
}

export interface MultiResolveResponse {
  items: MultiResolveItem[];
  failed: string[];
}

/**
 * 단건 미디어 조회
 */
export function useMediaResolveSingle(mediaId?: string, draftId?: string) {
  return useQuery({
    queryKey: ['mediaUrl', mediaId, draftId],
    queryFn: async () => {
      const response = await get<SingleResolveResponse>(
        `/api/media/${mediaId}/url`,
      );

      if (!response.success) throw createApiError(response);
      return response.data;
    },
    enabled: !!mediaId, // ID가 있을 때만
    staleTime: 1000 * 60 * 5, // 5분 캐싱
  });
}

/**
 * 다중 미디어 조회
 */
export function useMediaResolveMulti(mediaIds: string[], draftId?: string) {
  const sortedIds = [...mediaIds].sort();

  return useQuery({
    queryKey: ['mediaResolve', sortedIds],
    queryFn: async () => {
      const response = await post<MultiResolveResponse>('/api/media/resolve', {
        draftId,
        mediaIds,
      });

      if (!response.success) throw createApiError(response);
      return response.data;
    },
    enabled: mediaIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });
}
