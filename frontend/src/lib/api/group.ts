import { queryOptions } from '@tanstack/react-query';
import { get } from './api';
import { GroupMemberProfileResponse } from '../types/groupResponse';
import { createApiError } from '../utils/errorHandler';

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
