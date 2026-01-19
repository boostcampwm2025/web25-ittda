import { queryOptions } from '@tanstack/react-query';
import { get } from './api';
import { RecordDetailResponse } from '../types/record';
import { RecordPreview } from '../types/recordResponse';
import { createApiError } from '../utils/errorHandler';

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
    retry: false,
  });

export const recordPreviewListOptions = (date: string) =>
  queryOptions({
    queryKey: ['records', 'preview', date],
    queryFn: async () => {
      const response = await get<RecordPreview[]>(`/api/feed?date=${date}`);

      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
    retry: false,
  });
