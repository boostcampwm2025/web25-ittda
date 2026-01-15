import { queryOptions } from '@tanstack/react-query';
import { get } from './api';
import { RecordDetailResponse } from '../types/record';
import { createApiError } from '../utils/errorHandler';

export const recordDetailOptions = (recordId: string) =>
  queryOptions({
    queryKey: ['record', recordId],
    queryFn: async () => {
      const response = await get<RecordDetailResponse>(
        `/api/posts/eb044c86-4bbc-4888-8aea-dc75b1152bff`,
      );

      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
  });
