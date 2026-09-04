import { useState } from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PatchApplyPayload } from '@/lib/types/recordCollaboration';
import { RecordBlock } from '@/lib/types/recordField';

const mocks = vi.hoisted(() => ({
  socket: null as FakeSocket | null,
  routerReplace: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/store/useSocketStore', () => ({
  useSocketStore: () => ({
    socket: mocks.socket,
    sessionId: 'my-session',
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.routerReplace }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => mocks.toastError(...args),
    success: vi.fn(),
  },
}));

import { useRecordCollaboration } from './useRecordCollaboration';

type SocketHandler = (payload: never) => void;

class FakeSocket {
  private listeners = new Map<string, Set<SocketHandler>>();
  emitted: Array<{ event: string; payload: unknown }> = [];

  on(event: string, handler: SocketHandler) {
    const handlers = this.listeners.get(event) ?? new Set<SocketHandler>();
    handlers.add(handler);
    this.listeners.set(event, handlers);
  }

  off(event: string, handler: SocketHandler) {
    this.listeners.get(event)?.delete(handler);
  }

  emit(event: string, payload: unknown) {
    this.emitted.push({ event, payload });
  }

  serverEmit(event: string, payload: unknown) {
    this.listeners.get(event)?.forEach((handler) => handler(payload as never));
  }

  patches() {
    return this.emitted.filter(({ event }) => event === 'PATCH_APPLY');
  }
}

const firstPatch: PatchApplyPayload = {
  type: 'BLOCK_SET_VALUE',
  blockId: 'block-1',
  value: { text: '첫 번째 값' },
};

const layoutPatch: PatchApplyPayload = {
  type: 'BLOCK_MOVE',
  moves: [
    { blockId: 'block-1', layout: { row: 1, col: 2, span: 1 } },
    { blockId: 'block-2', layout: { row: 1, col: 1, span: 1 } },
  ],
};

describe('useRecordCollaboration patch queue', () => {
  beforeEach(() => {
    mocks.socket = new FakeSocket();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('앞 패치의 커밋 버전을 받은 뒤 다음 패치를 전송한다', async () => {
    const setBlocks = vi.fn();
    const setTitle = vi.fn();
    const { result } = renderHook(() =>
      useRecordCollaboration('draft-1', setBlocks, setTitle, 5),
    );

    let firstDispatched!: Promise<boolean>;
    let secondDispatched!: Promise<boolean>;
    act(() => {
      firstDispatched = result.current.applyPatch(firstPatch);
      secondDispatched = result.current.applyPatch(layoutPatch);
    });

    expect(await firstDispatched).toBe(true);
    expect(mocks.socket?.patches()).toEqual([
      {
        event: 'PATCH_APPLY',
        payload: {
          draftId: 'draft-1',
          baseVersion: 5,
          patch: firstPatch,
        },
      },
    ]);

    act(() => {
      mocks.socket?.serverEmit('PATCH_COMMITTED', {
        version: 6,
        patch: firstPatch,
        authorSessionId: 'my-session',
      });
    });

    expect(await secondDispatched).toBe(true);
    expect(mocks.socket?.patches()[1]).toEqual({
      event: 'PATCH_APPLY',
      payload: {
        draftId: 'draft-1',
        baseVersion: 6,
        patch: layoutPatch,
      },
    });

    act(() => {
      mocks.socket?.serverEmit('PATCH_COMMITTED', {
        version: 7,
        patch: layoutPatch,
        authorSessionId: 'my-session',
      });
    });

    await expect(result.current.waitForPendingPatches()).resolves.toBe(true);
    expect(result.current.versionRef.current).toBe(7);
  });

  it('원격 BLOCK_MOVE의 좌표 순서대로 로컬 블록 배열도 재정렬한다', () => {
    const { result } = renderHook(() => {
      const [blocks, setBlocks] = useState<RecordBlock[]>([
        {
          id: 'block-1',
          type: 'content' as const,
          value: { text: '첫 블록' },
          layout: { row: 1, col: 1, span: 1 },
        },
        {
          id: 'block-2',
          type: 'content' as const,
          value: { text: '둘째 블록' },
          layout: { row: 1, col: 2, span: 1 },
        },
      ]);
      const collaboration = useRecordCollaboration(
        'draft-1',
        setBlocks,
        vi.fn(),
        5,
      );
      return { blocks, ...collaboration };
    });

    act(() => {
      mocks.socket?.serverEmit('PATCH_COMMITTED', {
        version: 6,
        patch: layoutPatch,
        authorSessionId: 'other-session',
      });
    });

    expect(result.current.blocks.map(({ id }) => id)).toEqual([
      'block-2',
      'block-1',
    ]);
    expect(result.current.blocks.map(({ layout }) => layout)).toEqual([
      { row: 1, col: 1, span: 1 },
      { row: 1, col: 2, span: 1 },
    ]);
  });

  it('stale 거절 시 아직 전송하지 않은 패치를 취소하고 발행 대기를 실패시킨다', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useRecordCollaboration('draft-1', vi.fn(), vi.fn(), 5),
    );

    let queuedDispatch!: Promise<boolean>;
    act(() => {
      void result.current.applyPatch(firstPatch);
      queuedDispatch = result.current.applyPatch(layoutPatch);
    });

    act(() => {
      mocks.socket?.serverEmit('PATCH_REJECTED_STALE', {
        currentVersion: 6,
      });
    });

    await expect(queuedDispatch).resolves.toBe(false);
    await expect(result.current.waitForPendingPatches()).resolves.toBe(false);
    expect(mocks.socket?.patches()).toHaveLength(1);
    expect(mocks.toastError).toHaveBeenCalledOnce();
  });

  it('사진 미리보기 URL은 첫 패치와 대기 패치 모두 전송 전에 제거한다', () => {
    const { result } = renderHook(() =>
      useRecordCollaboration('draft-1', vi.fn(), vi.fn(), 2),
    );
    const photoPatch: PatchApplyPayload = {
      type: 'BLOCK_SET_VALUE',
      blockId: 'photos-1',
      value: {
        mediaIds: ['media-1'],
        tempUrls: ['data:image/png;base64,local'],
      },
    };

    act(() => {
      void result.current.applyPatch(photoPatch);
    });

    expect(mocks.socket?.patches()[0]).toEqual({
      event: 'PATCH_APPLY',
      payload: {
        draftId: 'draft-1',
        baseVersion: 2,
        patch: {
          ...photoPatch,
          value: { mediaIds: ['media-1'], tempUrls: [] },
        },
      },
    });
  });
});
