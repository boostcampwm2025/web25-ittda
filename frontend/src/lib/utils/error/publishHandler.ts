import { toast } from 'sonner';
import { type ApiError, ERROR_CODES } from '../errorHandler';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export const handlePublishError = (
  error: ApiError,
  router: AppRouterInstance,
  groupId?: string,
) => {
  const handlers: Record<string, () => void> = {
    [ERROR_CODES.NOT_FOUND]: () => {
      toast.error('이미 작성이 완료되었거나 존재하지 않는 기록입니다.');
      if (groupId) router.replace(`/group/${groupId}`);
    },

    // 버전 충돌
    [ERROR_CODES.CONFLICT]: () => {
      toast.error('편집 중 버전 충돌이 발생했습니다.', {
        description: '최신 내용을 반영하기 위해 페이지 동기화가 필요합니다.',
        action: {
          label: '동기화',
          onClick: () => window.location.reload(),
        },
        duration: Infinity,
      });
    },
  };

  const handler = handlers[error.code || ''];

  if (handler) {
    handler();
  }
};
