import { beforeEach, describe, expect, it, vi } from 'vitest';

const { toastError } = vi.hoisted(() => ({
  toastError: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: toastError,
  },
}));

import { showErrorToast } from './errorToast';

describe('showErrorToast', () => {
  beforeEach(() => {
    toastError.mockReset();
  });

  it('code 기반 안전 메시지만 토스트에 전달한다', () => {
    const error = Object.assign(new Error('raw database message'), {
      code: 'CONFLICT',
    });

    showErrorToast(error);

    expect(toastError).toHaveBeenCalledWith(
      '이미 처리된 요청이거나 중복된 데이터입니다.',
      undefined,
    );
  });

  it('알 수 없는 오류의 원문을 토스트에 전달하지 않는다', () => {
    showErrorToast(new Error('password=secret'));

    expect(toastError).toHaveBeenCalledWith(
      '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      undefined,
    );
  });

  it('토스트 옵션을 유지한다', () => {
    const options = { duration: 8000 };

    showErrorToast({ code: 'NETWORK_ERROR' }, options);

    expect(toastError).toHaveBeenCalledWith(
      '네트워크 오류가 발생했습니다. 연결 상태를 확인해 주세요.',
      options,
    );
  });
});
