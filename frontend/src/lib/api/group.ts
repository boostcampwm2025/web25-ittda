import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { get } from './api';
import {
  GroupCoverListResponse,
  GroupDailyRecordedDatesResponse,
  GroupListResponse,
} from '../types/recordResponse';
import {
  GroupEditResponse,
  GroupMemberProfileResponse,
} from '../types/groupResponse';
import { createApiError } from '../utils/errorHandler';
import { ROLE_MAP } from '../types/group';

export const groupListOptions = () =>
  queryOptions({
    queryKey: ['shared'],
    queryFn: async () => {
      const response = await get<GroupListResponse>('/api/groups');

      if (!response.success) {
        throw createApiError(response);
      }
      return response.data.items;
    },
    retry: false,
  });

export const groupMyProfileOptions = (groupId: string) =>
  queryOptions({
    queryKey: ['group', groupId, 'me'],
    queryFn: async () => {
      try {
        const res = await get<GroupMemberProfileResponse>(
          `/api/groups/${groupId}/members/me`,
        );
        if (!res.success) throw createApiError(res);

        return res.data;
      } catch (error) {
        // 임시로 더미 데이터 넣어주기
        return {
          groupId: groupId,
          userId: 'temp-user-123',
          name: '임시 사용자',
          nicknameInGroup: '주디',
          cover: {
            assetId: 'https://picsum.photos/200',
            sourcePostId: 'uuid-1',
          },
          role: 'ADMIN',
          updatedAt: new Date().toISOString(),
        };
      }
    },
    staleTime: 1000 * 60 * 5,
  });

export const groupDetailOptions = (groupId: string) =>
  queryOptions({
    queryKey: ['group', groupId, 'edit'],
    queryFn: async () => {
      try {
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
      } catch (error) {
        return {
          group: {
            groupId: groupId,
            name: '고3 전우들',
            createdAt: '2025-03-01T00:00:00Z',
            ownerUserId: 'user-001',
            cover: null, // 필요시 assetId 추가 가능
          },
          me: {
            userId: 'user-001',
            name: '본명1',
            profileImage: { assetId: 'https://picsum.photos/seed/bed/200' },
            role: ROLE_MAP['admin'],
            nicknameInGroup: '이구역 침대 지킴이',
            joinedAt: '2025-03-01T10:00:00Z',
          },
          members: [
            {
              userId: 'user-001',
              name: '본명1',
              profileImage: { assetId: 'https://picsum.photos/seed/bed/200' },
              role: ROLE_MAP['admin'],
              nicknameInGroup: '이구역 침대 지킴이',
              joinedAt: '2025-03-01T10:00:00Z',
            },
            {
              userId: 'user-002',
              name: '본명2',
              profileImage: {
                assetId: 'https://picsum.photos/seed/karina/200',
              },
              role: ROLE_MAP['admin'],
              nicknameInGroup: '자칭 우산동 카리나',
              joinedAt: '2025-03-05T14:20:00Z',
            },
            {
              userId: 'user-003',
              name: '본명3',
              profileImage: { assetId: 'https://picsum.photos/seed/food/200' },
              role: ROLE_MAP['admin'],
              nicknameInGroup: '입벌려 맛집 들어간다',
              joinedAt: '2025-03-07T09:10:00Z',
            },
            {
              userId: 'user-004',
              name: '본명4',
              profileImage: {
                assetId: 'https://picsum.photos/seed/davinci/200',
              },
              role: ROLE_MAP['admin'],
              nicknameInGroup: '오지랖퍼 다빈치',
              joinedAt: '2025-03-10T11:00:00Z',
            },
          ],
        };
      }
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
    getNextPageParam: (lastPage) =>
      lastPage.pageInfo.hasNext ? lastPage.pageInfo.nextCursor : undefined,
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
      `/api/groups/archives/${groupId}/record-days?month=${year}-${month}`,
    ],
    queryFn: async () => {
      const response = await get<GroupDailyRecordedDatesResponse>(
        `/api/groups/archives/${groupId}/record-days?month=${year}-${month}`,
      );

      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
    retry: false,
  });
