import { useAuthStore } from '@/store/useAuthStore';
import { useApiPatch, useApiPost } from './useApi';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RecordDetail } from '@/lib/types/recordResponse';
import { CreateRecordRequest } from '@/lib/types/record';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { ApiResponse } from '@/lib/types/response';
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
    onSuccess?: () => void;
  },
) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { userId } = useAuthStore();
  const [pendingNavUrl, setPendingNavUrl] = useState<string | null>(null);
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    if (!pendingNavUrl || isNavigatingRef.current) return;
    isNavigatingRef.current = true;

    const url = pendingNavUrl;

    // vaul Drawer가 open 시 history.pushState({__drawerId}, ''), close 시
    // replaceState({__drawerClosed: true}) 를 호출해 history 항목이 남는다.
    // router.replace 전에 이 항목들을 모두 제거해야 /add 가 history에 남지 않는다.
    const clearDrawerHistoryAndNavigate = () => {
      const state = history.state as Record<string, unknown> | null;
      if (state?.__drawerId || state?.__drawerClosed) {
        const handlePop = () => {
          window.removeEventListener('popstate', handlePop);
          clearDrawerHistoryAndNavigate();
        };
        window.addEventListener('popstate', handlePop);
        history.go(-1);
      } else {
        setPendingNavUrl(null);
        isNavigatingRef.current = false;
        router.replace(url);
      }
    };

    clearDrawerHistoryAndNavigate();
  }, [pendingNavUrl]);

  const invalidateQuery = async () => {
    // revalidatePath 서버 액션 제외: 네비게이션 도중 응답이 도착하면
    // Next.js App Router가 진행 중인 네비게이션을 취소해 /add로 되돌아가는 버그 발생.
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['my', 'records'] }),
      queryClient.invalidateQueries({ queryKey: ['records'] }),
      queryClient.invalidateQueries({ queryKey: ['profile'] }),
      queryClient.invalidateQueries({ queryKey: ['summary'] }),
      queryClient.invalidateQueries({ queryKey: ['map', 'records'] }),
    ]);
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
      options?.onSuccess?.();
      const recordUrl = groupId
        ? `/record/${res.data.id}?scope=group&groupId=${groupId}`
        : `/record/${res.data.id}`;

      if (groupId) {
        // revalidatePath 서버 액션 전부 제외: 네비게이션 도중 응답이 도착하면
        // Next.js App Router가 진행 중인 네비게이션을 취소해 /add로 되돌아가는 버그 발생.
        Promise.all([
          queryClient.invalidateQueries({ queryKey: ['me'] }),
          queryClient.invalidateQueries({ queryKey: ['summary'] }),
          queryClient.invalidateQueries({ queryKey: ['pattern'] }),
          queryClient.refetchQueries({ queryKey: ['search', 'tags'] }),
          queryClient.invalidateQueries({
            queryKey: ['group', groupId, 'records'],
          }),
          queryClient.invalidateQueries({ queryKey: ['shared'] }),
          queryClient.invalidateQueries({ queryKey: ['map', 'records'] }),
        ]);

        // React lifecycle 안에서 replace해야 history entry가 제대로 교체됨
        setPendingNavUrl(recordUrl);
        return;
      }

      // 개인 기록은 소프트 네비게이션 유지
      // 백그라운드에서 캐시 무효화
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['me'] }),
        queryClient.invalidateQueries({ queryKey: ['summary'] }),
        queryClient.invalidateQueries({ queryKey: ['pattern'] }),
        queryClient.refetchQueries({ queryKey: ['search', 'tags'] }),
      ]);
      invalidateQuery();

      // React lifecycle 안에서 replace해야 history entry가 제대로 교체됨
      setPendingNavUrl(recordUrl);

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
