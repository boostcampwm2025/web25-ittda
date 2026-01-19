import { useState, useRef } from 'react';
import { RecordBlock } from '@/lib/types/recordField';
import { FieldType } from '@/lib/types/record';
import { normalizeLayout } from '../_utils/recordLayoutHelper';

export const useRecordEditorDnD = (
  blocks: RecordBlock[],
  setBlocks: React.Dispatch<React.SetStateAction<RecordBlock[]>>,
  canBeHalfWidth: (type: FieldType) => boolean,
) => {
  const [isDraggingId, setIsDraggingId] = useState<string | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const gridRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (id: string) => setIsDraggingId(id);

  const handleDragOver = (
    e: React.DragEvent,
    targetId: string,
    targetEl?: HTMLElement,
  ) => {
    e.preventDefault();
    if (isDraggingId === targetId) return;

    const now = Date.now();
    if (now - lastUpdateRef.current < 50) return;
    lastUpdateRef.current = now;

    const dragIdx = blocks.findIndex((b) => b.id === isDraggingId);
    const hoverIdx = blocks.findIndex((b) => b.id === targetId);
    if (dragIdx === -1 || hoverIdx === -1) return;

    const rect = (
      targetEl ?? (e.currentTarget as HTMLElement)
    ).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const draggingBlock = blocks[dragIdx];
    const hoverBlock = blocks[hoverIdx];

    let nextSpan = draggingBlock.layout.span;
    let hoverNextSpan = hoverBlock.layout.span;
    let insertIndex = hoverIdx;

    const isHalfWidthCapable = canBeHalfWidth(draggingBlock.type);
    const isRightHalf = x > rect.width / 2;
    const isBottomHalf = y > rect.height / 2;
    const horizontalIntent = x < rect.width * 0.3 || x > rect.width * 0.7;

    if (isHalfWidthCapable && horizontalIntent) {
      nextSpan = 1;
      if (hoverBlock.layout.span === 2 && canBeHalfWidth(hoverBlock.type)) {
        hoverNextSpan = 1;
      }
      insertIndex = isRightHalf ? hoverIdx + 1 : hoverIdx;
    } else {
      nextSpan = 2;
      insertIndex = isBottomHalf ? hoverIdx + 1 : hoverIdx;
    }

    if (
      dragIdx !== hoverIdx ||
      draggingBlock.layout.span !== nextSpan ||
      hoverNextSpan !== hoverBlock.layout.span
    ) {
      const newBlocks = [...blocks];
      newBlocks[dragIdx].layout.span = nextSpan;
      if (hoverNextSpan !== hoverBlock.layout.span) {
        newBlocks[hoverIdx].layout.span = hoverNextSpan;
      }
      const [draggedItem] = newBlocks.splice(dragIdx, 1);
      const adjustedIndex =
        dragIdx < insertIndex ? insertIndex - 1 : insertIndex;
      newBlocks.splice(adjustedIndex, 0, draggedItem);

      setBlocks(normalizeLayout(newBlocks));
    }
  };

  const handleGridDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    const targetEl = (e.target as HTMLElement).closest(
      '[data-block-id]',
    ) as HTMLElement | null;
    if (targetEl || !gridRef.current) return;

    const elements = Array.from(
      gridRef.current.querySelectorAll<HTMLElement>('[data-block-id]'),
    );
    if (elements.length === 0) return;

    let closest: HTMLElement | null = null;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (const el of elements) {
      const rect = el.getBoundingClientRect();
      const centerY = (rect.top + rect.bottom) / 2;
      const distance = Math.abs(centerY - e.clientY);
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = el;
      }
    }

    if (closest) {
      const id = closest.getAttribute('data-block-id');
      if (id) handleDragOver(e, id, closest);
    }
  };

  return {
    gridRef,
    isDraggingId,
    setIsDraggingId,
    handleDragStart,
    handleDragOver,
    handleGridDragOver,
  };
};
