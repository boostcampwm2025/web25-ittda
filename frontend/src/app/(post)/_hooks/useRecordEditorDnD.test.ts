import { useState } from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RecordBlock } from '@/lib/types/recordField';

vi.mock('@/hooks/useHaptic', () => ({
  useHaptic: () => ({ trigger: vi.fn() }),
}));

import { useRecordEditorDnD } from './useRecordEditorDnD';

function pointerEvent(
  type: string,
  options: {
    pointerId: number;
    pointerType: string;
    clientX: number;
    clientY: number;
  },
) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    pointerId: { value: options.pointerId },
    pointerType: { value: options.pointerType },
    clientX: { value: options.clientX },
    clientY: { value: options.clientY },
  });
  return event;
}

describe('useRecordEditorDnD', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('드래그 이동 직후 pointerup이 와도 최신 레이아웃을 패치한다', () => {
    const initialBlocks: RecordBlock[] = [
      {
        id: 'block-a',
        type: 'content',
        value: { text: 'A' },
        layout: { row: 1, col: 1, span: 2 },
      },
      {
        id: 'block-b',
        type: 'content',
        value: { text: 'B' },
        layout: { row: 2, col: 1, span: 2 },
      },
    ];
    const applyPatch = vi.fn();

    const blockA = document.createElement('div');
    blockA.dataset.blockId = 'block-a';
    const blockB = document.createElement('div');
    blockB.dataset.blockId = 'block-b';
    blockB.getBoundingClientRect = () =>
      ({
        left: 0,
        right: 100,
        top: 0,
        bottom: 100,
        width: 100,
        height: 100,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;
    document.body.append(blockA, blockB);
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: vi.fn(() => blockB),
    });

    const { result } = renderHook(() => {
      const [blocks, setBlocks] = useState(initialBlocks);
      const dnd = useRecordEditorDnD(
        blocks,
        setBlocks,
        () => true,
        applyPatch,
        'draft-1',
      );
      return { blocks, ...dnd };
    });

    act(() => {
      blockA.dispatchEvent(
        pointerEvent('pointerdown', {
          pointerId: 1,
          pointerType: 'mouse',
          clientX: 10,
          clientY: 50,
        }),
      );
      document.dispatchEvent(
        pointerEvent('pointermove', {
          pointerId: 1,
          pointerType: 'mouse',
          clientX: 20,
          clientY: 50,
        }),
      );
    });

    // 같은 이벤트 턴에 이동과 종료가 연달아 발생하면 React effect는 아직 blocksRef를
    // 갱신하지 못한다. 드래그 로직이 ref를 즉시 갱신해야 최신 순서가 전송된다.
    act(() => {
      document.dispatchEvent(
        pointerEvent('pointermove', {
          pointerId: 1,
          pointerType: 'mouse',
          clientX: 90,
          clientY: 50,
        }),
      );
      document.dispatchEvent(
        pointerEvent('pointerup', {
          pointerId: 1,
          pointerType: 'mouse',
          clientX: 90,
          clientY: 50,
        }),
      );
    });

    expect(result.current.blocks.map((block) => block.id)).toEqual([
      'block-b',
      'block-a',
    ]);
    expect(applyPatch).toHaveBeenCalledWith({
      type: 'BLOCK_MOVE',
      moves: [
        {
          blockId: 'block-b',
          layout: { row: 1, col: 1, span: 1 },
        },
        {
          blockId: 'block-a',
          layout: { row: 1, col: 2, span: 1 },
        },
      ],
    });
  });
});
