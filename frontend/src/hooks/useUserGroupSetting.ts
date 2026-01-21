import { useApiPatch } from '@/hooks/useApi';
import { createApiError } from '@/lib/utils/errorHandler';
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

  const updateMutation = useApiPatch<UpdateGroupMeParams>(
    `/api/groups/${groupId}/members/me`,
    {
      onSuccess: (res) => {
        if (!res.success) createApiError(res);
        toast.success('프로필 정보가 수정되었습니다.');

        router.replace(`/group/${groupId}/edit`);
      },
    },
  );

  return {
    updateProfile: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
};
