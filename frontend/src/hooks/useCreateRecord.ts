import { useAuthStore } from '@/store/useAuthStore';
import { useApiPost } from './useApi';
import { useRouter } from 'next/navigation';
import { RecordDetail } from '@/lib/types/recordResponse';
import { CreateRecordRequest } from '@/lib/types/record';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export interface PublishRecordRequest {
  draftId: string;
  draftVersion: number;
  post: CreateRecordRequest;
}

export const useCreateRecord = (
  groupId?: string,
  options?: {
    onError?: (error: Error) => void;
  },
) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { userId } = useAuthStore();

  // 일반 게시글 생성
  const createMutation = useApiPost<RecordDetail, CreateRecordRequest>(
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

  // 공동 기록 게시글 생성
  const publishMutation = useApiPost<RecordDetail, PublishRecordRequest>(
    `/api/groups/${groupId}/posts/publish`,
    {
      onSuccess: (res) => {
        if (res.success && res.data?.id) {
          router.replace(`/record/${res.data?.id}`);
        }
      },
      onError: (error) => {
        toast.error('기록 저장 중 오류가 발생했습니다.');
        options?.onError?.(error);
      },
    },
    false,
    { 'x-user-id': userId ?? '' },
  );

  // 게시글 생성 관련 함수
  const execute = async ({
    draftId,
    draftVersion,
    payload,
  }: {
    draftId?: string;
    draftVersion?: number;
    payload: CreateRecordRequest;
  }) => {
    if (draftId && draftVersion) {
      const publishPayload = {
        draftId,
        draftVersion,
        post: payload,
      };

      return publishMutation.mutate(publishPayload);
    }

    return createMutation.mutate(payload);
  };

  return {
    execute,
    isLoading: createMutation.isPending || publishMutation.isPending,
  };
};
