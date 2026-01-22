import { useApiPost } from './useApi';
import { useQuery } from '@tanstack/react-query';
import { post } from '@/lib/api/api';
import { createApiError } from '@/lib/utils/errorHandler';
import { InviteJoinResponse } from '@/lib/types/groupResponse';

export interface InviteResponse {
  inviteId: string;
  code: string;
  expiresAt: string;
}

/**
 * 그룹 초대 코드 생성
 * @param groupId
 * @returns
 */
export const useCreateInviteCode = (
  groupId: string,
  role: string,
  isOpen: boolean,
) => {
  const requestBody = {
    permission: role,
    expiresInSeconds: 86400, // 24시간
  };
  return useQuery({
    queryKey: ['groupInviteCode', groupId, requestBody.permission],
    queryFn: async () => {
      const response = await post<InviteResponse>(
        `/api/groups/${groupId}/invites`,
        requestBody,
      );

      if (!response.success) {
        throw createApiError(response);
      }

      return response.data;
    },
    staleTime: 1000 * 60 * 60 * 24, // 24시간 유지 (권한 안 바뀌면 계속)
    gcTime: 1000 * 60 * 60 * 24, // 24시간 유지
    enabled: !!groupId && !!isOpen,
  });
};

/**
 * 그룹 초대 코드를 통한 가입
 * @param code
 * @returns
 */
export const useJoinGroup = (code: string) => {
  //TODO: 임시 Response 이후 확정나면 수정
  return useApiPost<InviteJoinResponse>(`/api/groups/invites/${code}/join`);
};
