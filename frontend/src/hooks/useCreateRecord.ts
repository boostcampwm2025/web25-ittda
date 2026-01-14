import { useAuthStore } from '@/store/useAuthStore';
import { useApiPost } from './useApi';
import { CreateRecordRequest } from '@/lib/types/record';
import { useRouter } from 'next/navigation';
export const useCreateRecord = () => {
  const router = useRouter();
  const { userId } = useAuthStore();

  //TODO : 임시 로직 이후 확인 예정
  if (!userId) throw new Error('로그인 필요');
  const mutation = useApiPost<CreateRecordRequest>(
    '/v1/posts',
    {
      onSuccess: (data) => {
        // TODO: 응답 형태 확인 후 주석 해제
        // if (data?.id) {
        //   router.push(`/record/${data.id}`);
        // }
      },
    },
    false,
    { 'x-user-id': userId ?? '' },
  );

  return mutation;
};
