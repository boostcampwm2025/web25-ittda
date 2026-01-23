import { queryOptions } from '@tanstack/react-query';
import { TagStatSummary } from '../types/profile';
import {
  RecordPatternResponse,
  UserProfileResponse,
} from '../types/profileResponse';
import { createApiError } from '../utils/errorHandler';
import { get } from './api';

export const userProfileOptions = () =>
  queryOptions({
    queryKey: ['me'],
    queryFn: async () => {
      const response = await get<UserProfileResponse>('/api/me');

      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
    retry: false,
  });

export const userProfileTagSummaryOptions = () =>
  queryOptions({
    queryKey: ['tag', 'summary'],
    queryFn: async () => {
      const response = await get<TagStatSummary>('/api/me/tags/stats?limit=10');

      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
    retry: false,
  });

export const userProfileEmotionSummaryOptions = () =>
  queryOptions({
    queryKey: ['emotion', 'summary'],
    queryFn: async () => {
      const response = await get<TagStatSummary>(
        '/api/me/emotions/stats?limit=7',
      );

      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
    retry: false,
  });

export const userRecordPatternOptions = (date: string) =>
  queryOptions({
    queryKey: ['pattern'],
    queryFn: async () => {
      const response = await get<RecordPatternResponse>(
        `/v1/me/stats/summary?date=${date}`,
      );

      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
    retry: false,
  });
