import { useApiDelete } from '@/hooks/useApi';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

/**
 * 그룹 삭제
 */
export const useDeleteGroup = (groupId: string, groupName: string) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useApiDelete<void, void>(`/api/groups/${groupId}`, {
    onSuccess: () => {
      toast.success(`${groupName}이 삭제되었습니다.`);
      queryClient.invalidateQueries({ queryKey: ['share'] });

      setTimeout(() => {
        router.push('/shared');
      }, 1000);
    },
  });
};
