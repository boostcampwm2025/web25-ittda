import { queryOptions } from '@tanstack/react-query';
import { get } from './api';
import { createApiError } from '../utils/errorHandler';
import {
  MyDailyRecordListResponse,
  MyMonthlyRecordListResponse,
} from '../types/recordResponse';
import { convertDayRecords } from '@/app/(post)/_utils/convertMonthRecords';

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

export const myDailyRecordListOptions = (month?: string) =>
  queryOptions({
    queryKey: month
      ? ['my', 'records', 'daily', month]
      : ['my', 'records', 'daily'],
    queryFn: async () => {
      const response = await get<MyDailyRecordListResponse[]>(
        `/api/user/archives/day?month=${month}`,
      );

      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
    select: (data: MyDailyRecordListResponse[]) => convertDayRecords(data),
    retry: false,
  });
