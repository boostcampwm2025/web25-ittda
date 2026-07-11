import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const useApiDeleteMock = vi.fn();
vi.mock('@/hooks/useApi', () => ({
  useApiDelete: (...args: unknown[]) => useApiDeleteMock(...args),
}));

const invalidateQueriesMock = vi.fn();
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: invalidateQueriesMock }),
}));

const routerPushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: routerPushMock }),
}));

const toastSuccessMock = vi.fn();
vi.mock('sonner', () => ({
  toast: { success: (...args: unknown[]) => toastSuccessMock(...args) },
}));

import { useDeleteGroup } from './useGroupActions';

describe('useDeleteGroup', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('올바른 endpoint로 useApiDelete를 호출한다', () => {
    useApiDeleteMock.mockReturnValue({ mutate: vi.fn() });

    renderHook(() => useDeleteGroup('group-1', '우리 그룹'));

    expect(useApiDeleteMock).toHaveBeenCalledWith(
      '/api/groups/group-1',
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it('삭제 성공 시 토스트, 캐시 무효화, /shared 이동을 모두 수행한다', () => {
    useApiDeleteMock.mockReturnValue({ mutate: vi.fn() });

    renderHook(() => useDeleteGroup('group-1', '우리 그룹'));

    const onSuccess = useApiDeleteMock.mock.calls[0][1].onSuccess;
    onSuccess();

    expect(toastSuccessMock).toHaveBeenCalledWith('우리 그룹이 삭제되었습니다.');
    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: ['shared'],
    });
    expect(routerPushMock).toHaveBeenCalledWith('/shared');
  });
});
