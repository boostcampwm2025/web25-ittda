import { cache } from 'react';
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { get } from './api';
import {
  DailyRecordList,
  GroupCoverListResponse,
  GroupDailyRecordedDatesResponse,
  GroupListResponse,
  MonthlyRecordList,
} from '../types/recordResponse';
import {
  GroupEditResponse,
  GroupMemberProfileResponse,
  GroupMemberRoleResponse,
  GroupMembersResponse,
} from '../types/groupResponse';
import { createApiError } from '../utils/errorHandler';
import {
  convertDayRecords,
  convertMontRecords,
} from '@/app/(post)/_utils/convertMonthRecords';
import { PERSONAL_STALE_TIME } from '../constants/constants';

// ============================================
// 서버 컴포넌트용 캐시된 함수 (React cache)
// ============================================

/**
 * 서버 컴포넌트에서 사용하는 캐시된 그룹 멤버 조회
 */
export const getCachedGroupCurrentMembers = cache(async (groupId: string) => {
  const response = await get<GroupMembersResponse>(
    `/api/groups/${groupId}/current-members`,
  );
  if (!response.success) {
    throw createApiError(response);
  }
  return response.data;
});

/**
 * 서버 컴포넌트에서 사용하는 캐시된 그룹 내 월별 기록함 조회
 */
export const getCachedGroupMonthlyRecordList = cache(
  async (groupId: string, year: string) => {
    const query = year
      ? `?year=${year}&sort=latest`
      : `?year=${new Date().getFullYear()}&sort=latest`;

    const response = await get<MonthlyRecordList[]>(
      `/api/groups/${groupId}/archives/months${query}`,
    );
    if (!response.success) {
      throw createApiError(response);
    }
    return response.data ?? [];
  },
);

/**
 * 서버 컴포넌트에서 사용하는 캐시된 그룹 내 일별 기록함 조회
 */
export const getCachedGroupDailyRecordList = cache(
  async (groupId: string, month: string) => {
    const response = await get<DailyRecordList[]>(
      `/api/groups/${groupId}/archives/days?month=${month}`,
    );
    if (!response.success) {
      throw createApiError(response);
    }
    return response.data;
  },
);

/**
 * 서버 컴포넌트에서 사용하는 캐시된 group 목록 조회
 */
export const getCachedGroupList = cache(async () => {
  const response = await get<GroupListResponse>('/api/groups');
  if (!response.success) {
    throw createApiError(response);
  }
  return response.data;
});

/**
 * 서버 컴포넌트에서 사용하는 캐시된 group 정보 조회
 */
export const getCachedGroupDetail = cache(async (groupId: string) => {
  const response = await get<GroupEditResponse>(
    `/api/groups/${groupId}/settings`,
  );
  if (!response.success) {
    const status = response.error?.code; // 서버 응답의 에러 코드
    if (status === 'FORBIDDEN' || status === 'NOT_FOUND') {
      throw response.error;
    }
    throw createApiError(response);
  }
  return response.data;
});

/**
 * 서버 컴포넌트에서 사용하는 캐시된 group 내 내 정보 조회
 */
export const getCachedGroupMyProfile = cache(async (groupId: string) => {
  const response = await get<GroupMemberProfileResponse>(
    `/api/groups/${groupId}/members/me`,
  );
  if (!response.success) {
    throw createApiError(response);
  }
  return response.data;
});

// ============================================
// 클라이언트 컴포넌트용 queryOptions (React Query)
// ============================================

export const groupListOptions = () =>
  queryOptions({
    queryKey: ['shared'],
    queryFn: async () => {
      const response = await get<GroupListResponse>('/api/groups');

      if (!response.success) {
        throw createApiError(response);
      }
      return response.data?.items ?? [];
    },
    staleTime: PERSONAL_STALE_TIME, // 초대를 수락했을 때 invalidate 필요
    retry: false,
    refetchOnMount: false, // hydrated 데이터가 있으면 마운트 시 refetch하지 않음
  });

export const groupMyProfileOptions = (groupId: string) =>
  queryOptions({
    queryKey: ['group', groupId, 'me'],
    queryFn: async () => {
      const res = await get<GroupMemberProfileResponse>(
        `/api/groups/${groupId}/members/me`,
      );
      if (!res.success) throw createApiError(res);

      return res.data;
    },
    staleTime: PERSONAL_STALE_TIME,
  });

export const groupMyRoleOptions = (groupId: string) =>
  queryOptions({
    queryKey: ['group', groupId, 'me', 'role'],
    queryFn: async () => {
      const res = await get<GroupMemberRoleResponse>(
        `/api/groups/${groupId}/members/me/role`,
      );
      if (!res.success) throw createApiError(res);

      return res.data;
    },
    staleTime: PERSONAL_STALE_TIME,
  });

export const groupDetailOptions = (groupId: string) =>
  queryOptions({
    queryKey: ['group', groupId, 'edit'],
    queryFn: async () => {
      const res = await get<GroupEditResponse>(
        `/api/groups/${groupId}/settings`,
      );

      if (!res.success) {
        const status = res.error?.code; // 서버 응답의 에러 코드
        if (status === 'FORBIDDEN' || status === 'NOT_FOUND') {
          throw res.error;
        }
        throw createApiError(res);
      }

      return res.data;
    },
  });

export const groupRecordCoverOptions = (groupId: string) =>
  infiniteQueryOptions({
    queryKey: ['cover', groupId],
    queryFn: async ({ pageParam }) => {
      const url = pageParam
        ? `/api/groups/${groupId}/cover-candidates?cursor=${pageParam}`
        : `/api/groups/${groupId}/cover-candidates`;

      const response = await get<GroupCoverListResponse>(url);

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
    retry: false,
  });

export const groupDailyRecordedDatesOption = (
  groupId: string,
  year: number | string,
  month: number | string,
) =>
  queryOptions({
    queryKey: [
      'recordedDates',
      `/api/groups/${groupId}/archives/record-days?month=${year}-${month}`,
    ],
    queryFn: async () => {
      const response = await get<GroupDailyRecordedDatesResponse>(
        `/api/groups/${groupId}/archives/record-days?month=${year}-${month}`,
      );

      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
    retry: false,
  });

export const groupCurrentMembersOption = (groupId: string) =>
  queryOptions({
    queryKey: ['currentMembers', groupId],
    queryFn: async () => {
      const response = await get<GroupMembersResponse>(
        `/api/groups/${groupId}/current-members`,
      );

      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
    retry: false,
  });

export const groupMonthlyRecordListOptions = (groupId: string, year?: string) =>
  queryOptions({
    queryKey: year
      ? ['group', groupId, 'records', 'month', year]
      : ['group', groupId, 'records', 'month'],
    queryFn: async () => {
      const query = year
        ? `?year=${year}&sort=latest`
        : `?year=${new Date().getFullYear()}&sort=latest`;
      const response = await get<MonthlyRecordList[]>(
        `/api/groups/${groupId}/archives/months${query}`,
      );

      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
    select: (data: MonthlyRecordList[]) => convertMontRecords(data),
    retry: false,
  });

export const groupDailyRecordListOptions = (groupId: string, month: string) =>
  queryOptions({
    queryKey: ['group', groupId, 'records', 'daily', month],
    queryFn: async () => {
      // month validation (YYYY-MM)
      if (!/^\d{4}-\d{2}$/.test(month)) {
        console.warn(`Invalid month format: ${month}`);
        return [];
      }

      const response = await get<DailyRecordList[]>(
        `/api/groups/${groupId}/archives/days?month=${month}`,
      );

      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
    select: (data: DailyRecordList[]) => convertDayRecords(data),
    retry: false,
  });

export const groupMonthlyRecordCoverOptions = (
  groupId: string,
  month: string,
) =>
  infiniteQueryOptions({
    queryKey: ['cover', groupId, month],
    queryFn: async ({ pageParam }) => {
      const url = pageParam
        ? `/api/groups/${groupId}/archives/monthcover?yearMonth=${month}&cursor=${pageParam}`
        : `/api/groups/${groupId}/archives/monthcover?yearMonth=${month}`;

      const response = await get<GroupCoverListResponse>(url);

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
    retry: false,
  });
