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
  refreshRecordAndHomeData,
  refreshRecordData,
  refreshRecordGroupAndSharedData,
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
  blocksOverride?: {
    id: string;
    type: string;
    value: Record<string, unknown>;
    layout: Record<string, unknown>;
  }[];
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
    await refreshRecordAndHomeData();

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
        refreshRecordGroupAndSharedData(groupId),
      );
    }

    await Promise.all(invalidations);
  };

  // 일반 게시글 생성
  const createMutation = useApiPost<RecordDetail, CreateRecordRequest>(
    '/api/posts',
    {
      onSuccess: handleSuccess,
      onError: (error) => {
        toast.error('기록 저장에 실패했습니다. 다시 시도해 주세요.');
        options?.onError?.(error);
      },
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
      onError: (error) => {
        toast.error('기록 저장에 실패했습니다. 다시 시도해 주세요.');
        options?.onError?.(error);
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
      const recordUrl = `/record/${res.data?.id}`;

      if (groupId) {
        // Router Cache 무효화: router.replace 이전에 완료해야
        // 서버 액션 응답이 클라이언트에 도달해 Router Cache가 실제로 비워짐.
        // 이전 코드처럼 fire-and-forget으로 두면 revalidatePath가 늦게 실행돼
        // 사용자가 그룹 페이지로 돌아올 때 여전히 캐시된 old payload가 사용됨.
        await refreshGroupData(groupId);

        // 나머지 무효화는 네비게이션 이후 백그라운드에서 처리
        Promise.all([
          queryClient.invalidateQueries({ queryKey: ['me'] }),
          queryClient.invalidateQueries({ queryKey: ['summary'] }),
          queryClient.invalidateQueries({ queryKey: ['pattern'] }),
          queryClient.refetchQueries({ queryKey: ['search', 'tags'] }),
          queryClient.invalidateQueries({
            queryKey: ['group', groupId, 'records'],
          }),
          queryClient.invalidateQueries({ queryKey: ['shared'] }),
          refreshSharedData(),
          refreshRecordData(),
          refreshHomeData(),
        ]);

        router.replace(recordUrl);
        return;
      }

      // 개인 기록은 소프트 네비게이션 유지
      router.replace(recordUrl);

      // 백그라운드에서 캐시 무효화
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['me'] }),
        queryClient.invalidateQueries({ queryKey: ['summary'] }),
        queryClient.invalidateQueries({ queryKey: ['pattern'] }),
        queryClient.refetchQueries({ queryKey: ['search', 'tags'] }),
      ]);
      invalidateQuery();
      setTimeout(() => {
        toast.success('기록이 성공적으로 저장되었습니다.');
      }, 1000);
    }
  }

  // 게시글 생성 관련 함수
  const execute = async ({
    draftId,
    draftVersion,
    titleOverride,
    blocksOverride,
    payload,
  }: {
    draftId?: string;
    draftVersion?: number;
    titleOverride?: string;
    blocksOverride?: {
      id: string;
      type: string;
      value: Record<string, unknown>;
      layout: Record<string, unknown>;
    }[];
    payload?: CreateRecordRequest;
  }) => {
    if (groupId && draftId && typeof draftVersion === 'number') {
      return publishMutation.mutate({
        draftId,
        draftVersion,
        ...(titleOverride ? { titleOverride } : {}),
        ...(blocksOverride ? { blocksOverride } : {}),
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
