import { useAuthStore } from '@/store/useAuthStore';
import { useApiPost } from './useApi';
import { useRouter } from 'next/navigation';
import { SuccessResponse } from '@/lib/types/response';
import { RecordDetail } from '@/lib/types/recordResponse';
export const useCreateRecord = () => {
  const router = useRouter();
  const { userId } = useAuthStore();
  //TODO : 임시 로직 이후 확인 예정
  //if (!userId) throw new Error('로그인 필요');
  const mutation = useApiPost<RecordDetail>(
    '/api/posts',
    {
      onSuccess: (res) => {
        if (res.success && res.data?.id) {
          router.push(`/record/${res.data?.id}`);
        }
      },
    },
    false,
    { 'x-user-id': userId ?? '' },
  );

  return mutation;
};
