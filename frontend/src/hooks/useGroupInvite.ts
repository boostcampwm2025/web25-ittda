import { InviteRole } from '@/lib/types/group';
import { useApiPost } from './useApi';

export interface InviteRequest {
  permission: InviteRole;
  expiresInSeconds: number;
}

export interface InviteResponse {
  inviteId: string;
  code: string;
  expiresAt: string;
}

export const useGroupInvite = (groupId: string) => {
  return useApiPost<InviteResponse>(`/groups/${groupId}/invites`, {
    onSuccess: (res) => {},
  });
};
