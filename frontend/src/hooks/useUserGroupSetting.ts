import { useApiPatch } from '@/hooks/useApi';
import { CACHE_TAGS } from '@/lib/api/cache';
import { invalidateCache } from '@/lib/api/cache-actions';
import { createApiError } from '@/lib/utils/errorHandler';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export interface UpdateGroupMeParams {
  groupId: string;
  userId: string;
  nicknameInGroup?: string;
  profileMediaId?: string;
}

/**
 * 그룹 내 내 프로필 정보 수정
 */
export const useUpdateGroupProfile = (groupId: string) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const updateMutation = useApiPatch<UpdateGroupMeParams>(
    `/api/groups/${groupId}/members/me`,
    {
      onSuccess: (res) => {
        if (!res.success) createApiError(res);
        toast.success('프로필 정보가 수정되었습니다.');
        invalidateCache(CACHE_TAGS.PROFILE);
        queryClient.invalidateQueries({ queryKey: ['group', groupId, 'me'] });

        router.replace(`/group/${groupId}/edit`);
      },
    },
  );

  return {
    updateProfile: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
};
