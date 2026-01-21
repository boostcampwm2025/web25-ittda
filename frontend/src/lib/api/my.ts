import { queryOptions } from '@tanstack/react-query';
import { get } from './api';
import { createApiError } from '../utils/errorHandler';
import { MyMonthlyRecordListResponse } from '../types/recordResponse';

export const myMonthlyRecordListOptions = (year: string) =>
  queryOptions({
    queryKey: ['my', 'records', 'year', year],
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
