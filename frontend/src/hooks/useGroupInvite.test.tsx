import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const getMock = vi.fn();
const postMock = vi.fn();
vi.mock('@/lib/api/api', () => ({
  get: (...args: unknown[]) => getMock(...args),
  post: (...args: unknown[]) => postMock(...args),
}));

const useApiPostMock = vi.fn();
vi.mock('./useApi', () => ({
  useApiPost: (...args: unknown[]) => useApiPostMock(...args),
}));

import {
  useCreateInviteCode,
  useGetInviteInfo,
  useJoinGroup,
} from './useGroupInvite';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }
  return Wrapper;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('useCreateInviteCode', () => {
  it('isOpen이 false면 요청하지 않는다', () => {
    const { result } = renderHook(
      () => useCreateInviteCode('group-1', 'EDITOR', false),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(postMock).not.toHaveBeenCalled();
  });

  it('isOpen이 true면 초대 코드를 생성 요청한다', async () => {
    postMock.mockResolvedValue({
      success: true,
      data: { inviteId: 'i1', code: 'ABC123', expiresAt: '2099-01-01' },
    });

    const { result } = renderHook(
      () => useCreateInviteCode('group-1', 'EDITOR', true),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.code).toBe('ABC123');
    expect(postMock).toHaveBeenCalledWith('/api/groups/group-1/invites', {
      permission: 'EDITOR',
      expiresInSeconds: 86400,
    });
  });
});

describe('useGetInviteInfo', () => {
  it('code가 없으면 요청하지 않는다', () => {
    const { result } = renderHook(() => useGetInviteInfo(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getMock).not.toHaveBeenCalled();
  });

  it('code가 있으면 초대 정보를 조회한다', async () => {
    getMock.mockResolvedValue({ success: true, data: { groupName: '우리 그룹' } });

    const { result } = renderHook(() => useGetInviteInfo('ABC123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getMock).toHaveBeenCalledWith('/api/groups/invites/ABC123');
  });
});

describe('useJoinGroup', () => {
  it('초대 코드로 가입 엔드포인트를 호출하는 useApiPost를 반환한다', () => {
    useApiPostMock.mockReturnValue({ mutate: vi.fn() });

    renderHook(() => useJoinGroup('ABC123'));

    expect(useApiPostMock).toHaveBeenCalledWith(
      '/api/groups/invites/ABC123/join',
    );
  });
});
