import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RecordBlock } from '@/lib/types/recordField';

const mocks = vi.hoisted(() => ({
  toastError: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => mocks.toastError(...args),
  },
}));

vi.mock('@/store/useSocketStore', () => ({
  useSocketStore: () => ({ socket: null }),
}));

import { usePostEditorBlocks } from './usePostEditorBlocks';

const block: RecordBlock = {
  id: 'block-1',
  type: 'content',
  value: { text: '내용' },
  layout: { row: 1, col: 1, span: 2 },
};

describe('usePostEditorBlocks collaboration deletion', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('삭제 패치가 실제 전송되기 전에는 보유 락을 해제하지 않는다', async () => {
    let resolveDispatch!: (dispatched: boolean) => void;
    const applyPatch = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          resolveDispatch = resolve;
        }),
    );
    const releaseLock = vi.fn();
    const { result, unmount } = renderHook(() =>
      usePostEditorBlocks({
        blocks: [block],
        setBlocks: vi.fn(),
        draftId: 'draft-1',
        mySessionId: 'my-session',
        locks: { 'block:block-1': 'my-session' },
        requestLock: vi.fn(),
        releaseLock,
        applyPatch,
      }),
    );

    act(() => result.current.removeBlock('block-1'));

    expect(applyPatch).toHaveBeenCalledWith({
      type: 'BLOCK_DELETE',
      blockId: 'block-1',
    });
    expect(releaseLock).not.toHaveBeenCalled();
    expect(result.current.deletingBlockIds.has('block-1')).toBe(true);

    await act(async () => resolveDispatch(true));

    expect(releaseLock).toHaveBeenCalledWith('block:block-1');
    unmount();
  });

  it('큐에서 전송이 취소되면 삭제 중 표시를 즉시 복구한다', async () => {
    let resolveDispatch!: (dispatched: boolean) => void;
    const applyPatch = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          resolveDispatch = resolve;
        }),
    );
    const { result } = renderHook(() =>
      usePostEditorBlocks({
        blocks: [block],
        setBlocks: vi.fn(),
        draftId: 'draft-1',
        mySessionId: 'my-session',
        locks: {},
        requestLock: vi.fn(),
        releaseLock: vi.fn(),
        applyPatch,
      }),
    );

    act(() => result.current.removeBlock('block-1'));
    await act(async () => resolveDispatch(false));

    expect(result.current.deletingBlockIds.has('block-1')).toBe(false);
    expect(mocks.toastError).toHaveBeenCalledWith(
      '삭제에 실패했습니다. 다시 시도해 주세요.',
      { id: 'delete-failed-block-1' },
    );
  });
});
