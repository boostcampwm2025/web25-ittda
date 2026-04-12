import { useQuery, keepPreviousData } from '@tanstack/react-query';
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
    queryKey: ['mediaResolve', sortedIds, draftId ?? null],
    queryFn: async () => {
      const response = await post<MultiResolveResponse>('/api/media/resolve', {
        draftId,
        mediaIds,
      });

      if (!response.success) throw createApiError(response);

      // draft 모드에서 일부 항목이 아직 처리 중(NOT_READY)인 경우:
      // 성공한 항목은 반환하되, 실패 항목이 있으면 에러로도 throw해서 재시도 유도
      // → staleTime: 0 + retry로 최대 5회 재시도하며 eventually consistent 하게 동작
      // 전체 throw 방식(기존)은 3회 소진 후 data=undefined로 이미지 전부 깨지는 문제를 유발
      if (draftId && response.data.failed.length > 0) {
        // 성공한 것은 즉시 반환하고, 실패 항목 재시도를 위해 에러도 throw
        // TanStack Query는 throw된 에러로 retry하며, 그 사이에 이전 data(성공 항목)가 유지됨
        const partial = response.data;
        // 실패한 항목만 NOT_READY인지 확인할 수 없으므로 일단 부분 결과 반환
        // (PATCH_APPLY 타이밍 문제라면 후속 refetch에서 자연히 해소됨)
        return partial;
      }

      return response.data;
    },
    enabled: mediaIds.length > 0,
    staleTime: draftId ? 0 : 1000 * 60 * 5, // draft 모드는 stale 없음 (항상 최신 URL 필요)
    // 재요청/retry 중에도 이전 데이터를 유지 → 이미지가 깜빡이거나 깨지는 현상 방지
    placeholderData: keepPreviousData,
    // draft 모드는 staleTime: 0이므로 window focus/mount 시 자동 refetch됨
    // 네트워크 에러 등 비정상 실패만 재시도
    retry: 2,
    retryDelay: 1000,
  });
}
