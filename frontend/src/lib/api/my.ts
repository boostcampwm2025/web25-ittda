import { queryOptions } from '@tanstack/react-query';
import { get } from './api';
import { createApiError } from '../utils/errorHandler';
import { MyMonthlyRecordListResponse } from '../types/recordResponse';

export const myMonthlyRecordListOptions = (year?: string) =>
  queryOptions({
    queryKey: year
      ? ['my', 'records', 'month', year]
      : ['my', 'records', 'month'],
    queryFn: async () => {
      const response = await get<MyMonthlyRecordListResponse[]>(
        `/api/user/archives/months?year=${year}`,
      );

      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
    retry: false,
  });
