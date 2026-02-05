import { cache } from 'react';
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { get } from './api';
import { createApiError } from '../utils/errorHandler';
import {
  MyCoverListResponse,
  MyDailyRecordedDatesResponse,
  DailyRecordList,
  MonthlyRecordList,
} from '../types/recordResponse';
import {
  convertDayRecords,
  convertMontRecords,
} from '@/app/(post)/_utils/convertMonthRecords';
import { PERSONAL_STALE_TIME } from '../constants/constants';

// ============================================
// 서버 컴포넌트용 캐시된 함수 (React cache)
// ============================================

/**
 * 서버 컴포넌트에서 사용하는 캐시된 my 월별 기록함 목록 조회
 */
export const getCachedMyMonthlyRecordList = cache(async (year: string) => {
  const response = await get<MonthlyRecordList[]>(
    `/api/user/archives/months?year=${year}`,
  );
  if (!response.success) {
    throw createApiError(response);
  }
  return response.data;
});

/**
 * 서버 컴포넌트에서 사용하는 캐시된 my 일별 기록함 목록 조회
 */
export const getCachedMyDailyRecordList = cache(async (month: string) => {
  const response = await get<DailyRecordList[]>(
    `/api/user/archives/days?month=${month}`,
  );
  if (!response.success) {
    throw createApiError(response);
  }
  return response.data;
});

export const myMonthlyRecordListOptions = (year?: string) =>
  queryOptions({
    queryKey: year
      ? ['my', 'records', 'month', year]
      : ['my', 'records', 'month'],
    queryFn: async () => {
      const query = year
        ? `?year=${year}`
        : `?year=${new Date().getFullYear()}`;
      const response = await get<MonthlyRecordList[]>(
        `/api/user/archives/months${query}`,
      );

      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
    select: (data: MonthlyRecordList[]) => convertMontRecords(data),
    staleTime: PERSONAL_STALE_TIME,
    retry: false,
  });

export const myDailyRecordListOptions = (month?: string) =>
  queryOptions({
    queryKey: month
      ? ['my', 'records', 'daily', month]
      : ['my', 'records', 'daily'],
    queryFn: async () => {
      const response = await get<DailyRecordList[]>(
        `/api/user/archives/days?month=${month}`,
      );

      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
    select: (data: DailyRecordList[]) => convertDayRecords(data),
    staleTime: PERSONAL_STALE_TIME,
    retry: false,
  });

export const myMonthlyRecordCoverOptions = (month: string) =>
  infiniteQueryOptions({
    queryKey: ['cover', 'my', month],
    queryFn: async ({ pageParam }) => {
      const url = pageParam
        ? `/api/user/archives/monthcover?year=${month}&cursor=${pageParam}`
        : `/api/user/archives/monthcover?year=${month}`;

      const response = await get<MyCoverListResponse>(url);

      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => {
      if (!lastPage || !lastPage.pageInfo) return undefined;
      return lastPage.pageInfo.hasNext
        ? lastPage.pageInfo.nextCursor
        : undefined;
    },
    staleTime: PERSONAL_STALE_TIME,
    retry: false,
  });

export const myDailyRecordedDatesOption = (
  year: number | string,
  month: number | string,
) =>
  queryOptions({
    queryKey: [
      'recordedDates',
      `/api/user/archives/record-days?month=${year}-${month}`,
    ],
    queryFn: async () => {
      const response = await get<MyDailyRecordedDatesResponse>(
        `/api/user/archives/record-days?month=${year}-${month}`,
      );

      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
    staleTime: PERSONAL_STALE_TIME,
    retry: false,
  });
