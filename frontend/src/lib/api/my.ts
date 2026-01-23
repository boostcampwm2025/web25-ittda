import { queryOptions } from '@tanstack/react-query';
import { get } from './api';
import { createApiError } from '../utils/errorHandler';
import {
  MyCoverListResponse,
  MyDailyRecordListResponse,
  MyMonthlyRecordListResponse,
} from '../types/recordResponse';
import {
  convertDayRecords,
  convertMontRecords,
} from '@/app/(post)/_utils/convertMonthRecords';

export const myMonthlyRecordListOptions = (year?: string) =>
  queryOptions({
    queryKey: year
      ? ['my', 'records', 'month', year]
      : ['my', 'records', 'month'],
    queryFn: async () => {
      const query = year
        ? `?year=${year}`
        : `?year=${new Date().getFullYear()}`;
      const response = await get<MyMonthlyRecordListResponse[]>(
        `/v1/user/archives/months${query}`,
      );

      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
    select: (data: MyMonthlyRecordListResponse[]) => convertMontRecords(data),
    retry: false,
  });

export const myDailyRecordListOptions = (month?: string) =>
  queryOptions({
    queryKey: month
      ? ['my', 'records', 'daily', month]
      : ['my', 'records', 'daily'],
    queryFn: async () => {
      const response = await get<MyDailyRecordListResponse[]>(
        `/v1/user/archives/day?month=${month}`,
      );

      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
    select: (data: MyDailyRecordListResponse[]) => convertDayRecords(data),
    retry: false,
  });

export const myMonthlyRecordCoverOption = (month: string) =>
  queryOptions({
    queryKey: ['cover', 'my', month],
    queryFn: async () => {
      const response = await get<MyCoverListResponse>(
        `/v1/user/archives/monthcover?year=${month}`,
      );

      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
    retry: false,
  });
