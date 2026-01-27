import { useAuthStore } from '@/store/useAuthStore';
import { useApiPost } from './useApi';
import { useRouter } from 'next/navigation';
import { RecordDetail } from '@/lib/types/recordResponse';
import { useQueryClient } from '@tanstack/react-query';

export const useCreateRecord = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { userId } = useAuthStore();
  //TODO : 임시 로직 이후 확인 예정
  //if (!userId) throw new Error('로그인 필요');
  const mutation = useApiPost<RecordDetail>(
    '/api/posts',
    {
      onSuccess: async (res) => {
        if (res.success && res.data?.id) {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['records'] }),
            queryClient.invalidateQueries({ queryKey: ['me'] }),
            queryClient.invalidateQueries({ queryKey: ['summary'] }),
            queryClient.invalidateQueries({ queryKey: ['pattern'] }),
          ]);
          router.replace(`/record/${res.data?.id}`);
        }
      },
    },
    false,
    { 'x-user-id': userId ?? '' },
  );

  return mutation;
};
