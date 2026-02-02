import { useInfiniteQuery } from '@tanstack/react-query';
import { post } from '@/lib/api/api';
import { createApiError } from '@/lib/utils/errorHandler';
import { useApiQuery } from './useApi';

export interface SearchResultItem {
  id: string;
  thumbnailUrl?: string;
  title: string;
  eventAt: string;
  location?: {
    address: string;
    placeName?: string;
  };
  snippet: string;
}

export interface SearchResponse {
  items: SearchResultItem[];
  nextCursor: string | null;
}
export interface SearchFilters {
  query: string;
  tags: string[];
  emotions: string[];
  start: string | null;
  end: string | null;
  location?: {
    lat: number;
    lng: number;
    address?: string;
    radius?: number;
  };
}

export const useSearchQuery = (filters: SearchFilters) => {
  return useInfiniteQuery<SearchResponse>({
    queryKey: ['search', filters],
    queryFn: async ({ pageParam }) => {
      const response = await post<SearchResponse>(
        `/api/search${pageParam ? `?cursor=${pageParam}` : ''}`,
        {
          keyword: filters.query,
          startDate: filters.start,
          endDate: filters.end,
          tags: filters.tags,
          latitude: filters.location?.lat,
          longitude: filters.location?.lng,
          radius: filters.location?.radius || 10,
          // TODO: 현재는 감정 없음. 이후 추가 고려
        },
      );

      if (!response.success) throw createApiError(response);
      return response.data;
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
};

export function useFrequentTags(limit: number = 10) {
  return useApiQuery<{ tags: string[] }>(
    ['search', 'tags', 'frequent', limit],
    '/api/search/tags/stats',
    {
      params: { limit },
      staleTime: 1000 * 10,
    },
  );
}

/**
 * 최근 검색어 조회
 */
export function useRecentSearches() {
  return useApiQuery<{ keywords: string[] }>(
    ['search', 'recent'],
    '/api/search/recent',
    {
      staleTime: 0,
    },
  );
}
