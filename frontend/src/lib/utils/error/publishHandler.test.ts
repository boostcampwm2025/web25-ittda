import { describe, it, expect, vi, afterEach } from 'vitest';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

const toastErrorMock = vi.fn();
vi.mock('sonner', () => ({
  toast: { error: (...args: unknown[]) => toastErrorMock(...args) },
}));

import { handlePublishError } from './publishHandler';
import type { ApiError } from '../errorHandler';

function makeRouter(): AppRouterInstance {
  return { replace: vi.fn() } as unknown as AppRouterInstance;
}

describe('handlePublishError', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('NOT_FOUND이고 groupId가 있으면 안내 토스트와 함께 그룹 홈으로 이동한다', () => {
    const router = makeRouter();
    const error: ApiError = Object.assign(new Error('not found'), {
      code: 'NOT_FOUND',
    });

    handlePublishError(error, router, 'group-1');

    expect(toastErrorMock).toHaveBeenCalledWith(
      '이미 작성이 완료되었거나 존재하지 않는 기록입니다.',
    );
    expect(router.replace).toHaveBeenCalledWith('/group/group-1');
  });

  it('NOT_FOUND이고 groupId가 없으면 이동하지 않는다', () => {
    const router = makeRouter();
    const error: ApiError = Object.assign(new Error('not found'), {
      code: 'NOT_FOUND',
    });

    handlePublishError(error, router);

    expect(router.replace).not.toHaveBeenCalled();
  });

  it('CONFLICT면 동기화 액션이 포함된 토스트를 띄운다', () => {
    const router = makeRouter();
    const error: ApiError = Object.assign(new Error('conflict'), {
      code: 'CONFLICT',
    });

    handlePublishError(error, router);

    expect(toastErrorMock).toHaveBeenCalledWith(
      '편집 중 버전 충돌이 발생했습니다.',
      expect.objectContaining({
        action: expect.objectContaining({ label: '동기화' }),
      }),
    );
  });

  it('알 수 없는 코드면 실패 토스트만 띄운다', () => {
    const router = makeRouter();
    const error: ApiError = Object.assign(new Error('boom'), {
      code: 'INTERNAL_SERVER_ERROR',
    });

    handlePublishError(error, router);

    expect(toastErrorMock).toHaveBeenCalledWith(
      '기록 저장에 실패했습니다. 다시 시도해 주세요.',
    );
    expect(router.replace).not.toHaveBeenCalled();
  });
});
