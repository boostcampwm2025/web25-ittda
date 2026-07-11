import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const routerReplaceMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: routerReplaceMock }),
}));

vi.mock('@/store/useAuthStore', () => ({
  useAuthStore: () => ({ userId: 'user-1' }),
}));

const useApiPostMock = vi.fn();
const useApiPatchMock = vi.fn();
vi.mock('./useApi', () => ({
  useApiPost: (...args: unknown[]) => useApiPostMock(...args),
  useApiPatch: (...args: unknown[]) => useApiPatchMock(...args),
}));

const invalidateQueriesMock = vi.fn();
const refetchQueriesMock = vi.fn();
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: invalidateQueriesMock,
    refetchQueries: refetchQueriesMock,
  }),
}));

const toastErrorMock = vi.fn();
const toastSuccessMock = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => toastErrorMock(...args),
    success: (...args: unknown[]) => toastSuccessMock(...args),
  },
}));

const handlePublishErrorMock = vi.fn();
vi.mock('@/lib/utils/error/publishHandler', () => ({
  handlePublishError: (...args: unknown[]) => handlePublishErrorMock(...args),
}));

import { useCreateRecord } from './useCreateRecord';

function makeMutation() {
  return { mutate: vi.fn(), isPending: false };
}

// useApiPost는 createMutation('/api/posts')과 publishMutation(그룹 발행 엔드포인트)
// 두 곳에서 호출된다. onSuccess 콜백이 상태를 바꿔 재렌더링을 유발하므로
// mockReturnValueOnce 체이닝 대신, 매 호출마다 endpoint로 분기하는 구현을 사용한다.
function mockApiPost(
  createMutation: ReturnType<typeof makeMutation>,
  publishMutation: ReturnType<typeof makeMutation>,
) {
  useApiPostMock.mockImplementation((endpoint: string) =>
    endpoint === '/api/posts' ? createMutation : publishMutation,
  );
}

function lastOptionsFor(endpointPredicate: (endpoint: string) => boolean) {
  const calls = useApiPostMock.mock.calls.filter((c) =>
    endpointPredicate(c[0] as string),
  );
  return calls[calls.length - 1][1];
}

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('useCreateRecord.execute', () => {
  it('groupId + draftId + draftVersion이 있으면 publishMutation을 호출한다', () => {
    const createMutation = makeMutation();
    const publishMutation = makeMutation();
    mockApiPost(createMutation, publishMutation);
    useApiPatchMock.mockReturnValue(makeMutation());

    const { result } = renderHook(() => useCreateRecord('group-1'));
    result.current.execute({
      draftId: 'draft-1',
      draftVersion: 3,
      titleOverride: '새 제목',
    });

    expect(publishMutation.mutate).toHaveBeenCalledWith({
      draftId: 'draft-1',
      draftVersion: 3,
      titleOverride: '새 제목',
    });
    expect(createMutation.mutate).not.toHaveBeenCalled();
  });

  it('payload가 없고 그룹 발행 조건도 아니면 에러 토스트만 띄우고 아무것도 호출하지 않는다', async () => {
    mockApiPost(makeMutation(), makeMutation());
    useApiPatchMock.mockReturnValue(makeMutation());

    const { result } = renderHook(() => useCreateRecord());
    await result.current.execute({});

    expect(toastErrorMock).toHaveBeenCalledWith('게시글 수정에 실패했습니다.');
  });

  it('postId가 있으면 updateMutation을 호출한다', () => {
    mockApiPost(makeMutation(), makeMutation());
    const updateMutation = makeMutation();
    useApiPatchMock.mockReturnValue(updateMutation);

    const { result } = renderHook(() =>
      useCreateRecord(undefined, 'post-1'),
    );
    result.current.execute({ payload: { title: '수정된 제목' } as never });

    expect(updateMutation.mutate).toHaveBeenCalledWith({
      title: '수정된 제목',
    });
  });

  it('postId도 groupId/draftId도 없으면 createMutation을 호출한다', () => {
    const createMutation = makeMutation();
    mockApiPost(createMutation, makeMutation());
    useApiPatchMock.mockReturnValue(makeMutation());

    const { result } = renderHook(() => useCreateRecord());
    result.current.execute({ payload: { title: '새 글' } as never });

    expect(createMutation.mutate).toHaveBeenCalledWith({ title: '새 글' });
  });

  it('isLoading은 createMutation과 publishMutation의 isPending을 OR로 반영한다', () => {
    mockApiPost(
      { mutate: vi.fn(), isPending: true },
      { mutate: vi.fn(), isPending: false },
    );
    useApiPatchMock.mockReturnValue(makeMutation());

    const { result } = renderHook(() => useCreateRecord());
    expect(result.current.isLoading).toBe(true);
  });
});

describe('useCreateRecord - 저장 성공/실패 콜백', () => {
  it('개인 기록 저장 성공 시 onSuccess 콜백과 페이지 이동, 캐시 무효화가 일어난다', async () => {
    const onSuccess = vi.fn();
    mockApiPost(makeMutation(), makeMutation());
    useApiPatchMock.mockReturnValue(makeMutation());

    renderHook(() => useCreateRecord(undefined, undefined, { onSuccess }));

    const createOptions = lastOptionsFor((e) => e === '/api/posts');
    await act(async () => {
      await createOptions.onSuccess({
        success: true,
        data: { id: 'record-1' },
      });
    });

    expect(onSuccess).toHaveBeenCalled();
    await waitFor(() =>
      expect(routerReplaceMock).toHaveBeenCalledWith('/record/record-1'),
    );
    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: ['my', 'records'],
    });
  });

  it('그룹 기록 저장 성공 시 그룹 스코프 URL로 이동한다', async () => {
    mockApiPost(makeMutation(), makeMutation());
    useApiPatchMock.mockReturnValue(makeMutation());

    renderHook(() => useCreateRecord('group-1'));

    const createOptions = lastOptionsFor((e) => e === '/api/posts');
    await act(async () => {
      await createOptions.onSuccess({
        success: true,
        data: { id: 'record-2' },
      });
    });

    await waitFor(() =>
      expect(routerReplaceMock).toHaveBeenCalledWith(
        '/record/record-2?scope=group&groupId=group-1',
      ),
    );
  });

  it('createMutation 실패 시 에러 토스트를 띄우고 onError를 호출한다', () => {
    const onError = vi.fn();
    mockApiPost(makeMutation(), makeMutation());
    useApiPatchMock.mockReturnValue(makeMutation());

    renderHook(() => useCreateRecord(undefined, undefined, { onError }));

    const createOptions = lastOptionsFor((e) => e === '/api/posts');
    const error = new Error('저장 실패');
    createOptions.onError(error);

    expect(toastErrorMock).toHaveBeenCalledWith(
      '기록 저장에 실패했습니다. 다시 시도해 주세요.',
    );
    expect(onError).toHaveBeenCalledWith(error);
  });

  it('publishMutation 실패 시 handlePublishError로 위임한다', () => {
    const onError = vi.fn();
    mockApiPost(makeMutation(), makeMutation());
    useApiPatchMock.mockReturnValue(makeMutation());

    renderHook(() => useCreateRecord('group-1', 'post-1', { onError }));

    const publishOptions = lastOptionsFor((e) => e !== '/api/posts');
    const error = new Error('충돌');
    publishOptions.onError(error);

    expect(handlePublishErrorMock).toHaveBeenCalledWith(
      error,
      expect.objectContaining({ replace: routerReplaceMock }),
      'group-1',
    );
    expect(onError).toHaveBeenCalledWith(error);
  });

  it('updateMutation 성공 시 관련 쿼리를 무효화한다', async () => {
    mockApiPost(makeMutation(), makeMutation());
    useApiPatchMock.mockReturnValue(makeMutation());

    renderHook(() => useCreateRecord(undefined, 'post-1'));

    const updateOptions = useApiPatchMock.mock.calls[0][1];
    await act(async () => {
      await updateOptions.onSuccess({
        success: true,
        data: { id: 'post-1' },
      });
    });

    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: ['record', 'post-1'],
    });
    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: ['posts'],
    });
  });
});
