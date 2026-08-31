import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const useApiQueryMock = vi.fn();
const useApiPostMock = vi.fn();
vi.mock('./useApi', () => ({
  useApiQuery: (...args: unknown[]) => useApiQueryMock(...args),
  useApiPost: (...args: unknown[]) => useApiPostMock(...args),
}));

import { useNewPostDraft, useEditPostDraft } from './useGrouprRecord';

describe('useNewPostDraft', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('groupId 기반의 쿼리 키와 엔드포인트로 조회하되 자동 실행은 하지 않는다', () => {
    useApiQueryMock.mockReturnValue({ data: undefined });

    renderHook(() => useNewPostDraft('group-1'));

    expect(useApiQueryMock).toHaveBeenCalledWith(
      ['groupd', 'draft', 'group-1'],
      '/api/groups/group-1/posts/new',
      { enabled: false, retry: false },
    );
  });
});

describe('useEditPostDraft', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('groupId, postId로 수정용 draft 생성 엔드포인트를 호출한다', () => {
    useApiPostMock.mockReturnValue({ mutate: vi.fn() });

    renderHook(() => useEditPostDraft('group-1', 'post-1'));

    expect(useApiPostMock).toHaveBeenCalledWith(
      '/api/groups/group-1/posts/post-1/edit',
    );
  });
});
