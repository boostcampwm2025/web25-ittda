import { useApiQuery, useApiPatch } from '@/hooks/useApi';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export interface UpdateGroupMeParams {
  groupId: string;
  userId: string;
  nicknameInGroup?: string;
  profileMediaId?: string;
}

/**
 * 특정 그룹의 기본 정보 조회
 */
export const useGroupInfo = (groupId: string) =>
  useApiQuery(['group', groupId, 'info'], `/api/groups/${groupId}`, {
    enabled: !!groupId,
  });

/**
 * 그룹 내 내 프로필 정보 수정
 */
export const useUpdateGroupProfile = (groupId: string) => {
  const router = useRouter();

  const updateMutation = useApiPatch<UpdateGroupMeParams>(
    `/api/groups/${groupId}/members/me`,
    {
      onSuccess: () => {
        toast.success('프로필 정보가 수정되었습니다.');

        router.replace(`/group/${groupId}/edit`);
      },
      onError: (error) => {
        toast.error('수정에 실패했습니다. 다시 시도해 주세요.');
        console.error('Update Error:', error);
      },
    },
  );

  return {
    updateProfile: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
};
