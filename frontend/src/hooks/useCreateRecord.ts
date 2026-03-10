import { useAuthStore } from '@/store/useAuthStore';
import { useApiPatch, useApiPost } from './useApi';
import { useRouter } from 'next/navigation';
import { RecordDetail } from '@/lib/types/recordResponse';
import { CreateRecordRequest } from '@/lib/types/record';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { ApiResponse } from '@/lib/types/response';
import {
  refreshGroupData,
  refreshHomeData,
  refreshRecordData,
  refreshSharedData,
} from '@/lib/actions/revalidate';
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
  titleOverride?: string;
}

export const useCreateRecord = (
  groupId?: string,
  postId?: string,
  options?: {
    onError?: (error: Error) => void;
    onSuccess?: () => void;
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
        queryClient.invalidateQueries({
          queryKey: ['shared'],
        }),
        refreshGroupData(groupId),
        refreshSharedData(),
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
    {
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: ['record', postId] });
        queryClient.invalidateQueries({ queryKey: ['posts'] });
        handleSuccess(res);
      },
    },
  );

  // 공동 기록 게시글 생성
  const publishMutation = useApiPost<RecordDetail, PublishDraftDto>(
    postId
      ? `/api/groups/${groupId}/posts/${postId}/edit/publish` // 그룹 수정 발행
      : `/api/groups/${groupId}/posts/publish`,
    {
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: ['record', postId] });
        queryClient.invalidateQueries({ queryKey: ['posts'] });
        options?.onSuccess?.();
        handleSuccess(res);
      },
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
      // 캐시 무효화를 기다리지 않고 즉시 이동
      router.replace(`/record/${res.data?.id}`);

      // 백그라운드에서 캐시 무효화
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['me'] }),
        queryClient.invalidateQueries({ queryKey: ['summary'] }),
        queryClient.invalidateQueries({ queryKey: ['pattern'] }),
        queryClient.refetchQueries({ queryKey: ['search', 'tags'] }),
      ]);
      if (!res.data.groupId) {
        if (groupId) {
          invalidateQuery(groupId);
        } else {
          invalidateQuery();
        }
        setTimeout(() => {
          toast.success('기록이 성공적으로 저장되었습니다.');
        }, 1000);
      }
    }
  }

  // 게시글 생성 관련 함수
  const execute = async ({
    draftId,
    draftVersion,
    titleOverride,
    payload,
  }: {
    draftId?: string;
    draftVersion?: number;
    titleOverride?: string;
    payload?: CreateRecordRequest;
  }) => {
    if (groupId && draftId && typeof draftVersion === 'number') {
      return publishMutation.mutate({
        draftId,
        draftVersion,
        ...(titleOverride ? { titleOverride } : {}),
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
