import { useAuthStore } from '@/store/useAuthStore';
import { useApiPatch, useApiPost } from './useApi';
import { useRouter } from 'next/navigation';
import { RecordDetail } from '@/lib/types/recordResponse';
import { CreateRecordRequest } from '@/lib/types/record';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { ApiResponse } from '@/lib/types/response';
import { refreshHomeData, refreshRecordData } from '@/lib/actions/revalidate';
import { ApiError } from '@/lib/utils/errorHandler';
import { handlePublishError } from '@/lib/utils/error/publishHandler';

export interface PublishRecordRequest {
  draftId: string;
  draftVersion: number;
  post: CreateRecordRequest;
}
export interface PublishDraftDto {
  draftId: string;
  draftVersion: number;
}

export const useCreateRecord = (
  groupId?: string,
  postId?: string,
  options?: {
    onError?: (error: Error) => void;
  },
) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { userId } = useAuthStore();

  const invalidateQuery = async (groupId?: string) => {
    await Promise.all([refreshRecordData(), refreshHomeData()]);

    const invalidations = [
      queryClient.invalidateQueries({ queryKey: ['my', 'records'] }),
      queryClient.invalidateQueries({ queryKey: ['records'] }),
      queryClient.invalidateQueries({ queryKey: ['profile'] }),
      queryClient.invalidateQueries({ queryKey: ['summary'] }),
    ];

    if (groupId) {
      invalidations.push(
        queryClient.invalidateQueries({
          queryKey: ['group', groupId, 'records'],
        }),
      );
    }

    await Promise.all(invalidations);
  };

  // 일반 게시글 생성
  const createMutation = useApiPost<RecordDetail, CreateRecordRequest>(
    '/api/posts',
    {
      onSuccess: handleSuccess,
    },
    false,
    { 'x-user-id': userId ?? '' },
  );

  /**개인 게시글 수정 */
  const updateMutation = useApiPatch<RecordDetail, CreateRecordRequest>(
    `/api/posts/${postId}`,
    { onSuccess: handleSuccess },
  );

  // 공동 기록 게시글 생성
  const publishMutation = useApiPost<RecordDetail, PublishDraftDto>(
    postId
      ? `/api/groups/${groupId}/posts/${postId}/edit/publish` // 그룹 수정 발행
      : `/api/groups/${groupId}/posts/publish`,
    {
      onSuccess: handleSuccess,
      onError: (error) => {
        const apiError = error as ApiError;
        handlePublishError(apiError, router, groupId);
        options?.onError?.(error);
      },
    },
    false,
    { 'x-user-id': userId ?? '' },
  );

  async function handleSuccess(res: ApiResponse<RecordDetail>) {
    if (res.success && res.data?.id) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['records'] }),
        queryClient.invalidateQueries({ queryKey: ['me'] }),
        queryClient.invalidateQueries({ queryKey: ['summary'] }),
        queryClient.invalidateQueries({ queryKey: ['pattern'] }),
        queryClient.refetchQueries({ queryKey: ['search', 'tags'] }),
      ]);
      if (!res.data.groupId) {
        if (groupId) {
          await invalidateQuery(groupId);
        } else {
          await invalidateQuery();
        }
        setTimeout(() => {
          toast.success('기록이 성공적으로 저장되었습니다.');
        }, 1000);
      }

      router.replace(`/record/${res.data?.id}`);
    }
  }

  // 게시글 생성 관련 함수
  const execute = async ({
    draftId,
    draftVersion,
    payload,
  }: {
    draftId?: string;
    draftVersion?: number;
    payload?: CreateRecordRequest;
  }) => {
    if (groupId && draftId && typeof draftVersion === 'number') {
      return publishMutation.mutate({
        draftId,
        draftVersion,
      });
    }

    if (!payload) {
      toast.error('게시글 수정에 실패했습니다.');
      return;
    }
    // 개인 수정
    if (postId) {
      return updateMutation.mutate(payload);
    }

    // 개인 생성
    return createMutation.mutate(payload);
  };

  return {
    execute,
    isLoading: createMutation.isPending || publishMutation.isPending,
  };
};
