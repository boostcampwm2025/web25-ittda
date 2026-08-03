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
  } else {
    // 알려지지 않은 에러 코드(네트워크 오류, 예기치 못한 서버 오류 등)도
    // 사용자에게 실패를 알려야 로딩 화면만 조용히 사라지는 상황을 막을 수 있다.
    toast.error('기록 저장에 실패했습니다. 다시 시도해 주세요.');
  }
};
