import { useState, useRef, useEffect, useCallback } from 'react';
import { RecordBlock } from '@/lib/types/recordField';
import { FieldType } from '@/lib/types/record';
import { normalizeLayout } from '../_utils/recordLayoutHelper';
import { PatchApplyPayload } from '@/lib/types/recordCollaboration';

export const useRecordEditorDnD = (
  blocks: RecordBlock[],
  setBlocks: React.Dispatch<React.SetStateAction<RecordBlock[]>>,
  canBeHalfWidth: (type: FieldType) => boolean,
  applyPatch?: (patch: PatchApplyPayload) => void,
  draftId?: string,
) => {
  const [isDraggingId, setIsDraggingId] = useState<string | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const isPointerDraggingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const capturedElementRef = useRef<HTMLElement | null>(null);

  const handleDragStart = (id: string) => {
    setIsDraggingId(id);
    isPointerDraggingRef.current = true;
  };

  const handleDragOver = (
    e: React.DragEvent,
    targetId: string,
    targetEl?: HTMLElement,
  ) => {
    e.preventDefault();
    if (isDraggingId === targetId) return;

    const now = Date.now();
    if (now - lastUpdateRef.current < 16) return; // ~60fps (1000ms/60 ≈ 16ms)
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
    // 수평 이동 의도: 세로 중앙 영역에서 가로 끝 영역에 있을 때만
    const isVerticalCenter = y > rect.height * 0.3 && y < rect.height * 0.7;
    const horizontalIntent =
      isVerticalCenter && (x < rect.width * 0.3 || x > rect.width * 0.7);

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

    // 마지막 블록보다 아래로 드래그하는 경우 처리
    const lastElement = elements[elements.length - 1];
    const lastRect = lastElement.getBoundingClientRect();

    if (e.clientY > lastRect.bottom + 10) {
      // 20px 여유 추가
      const now = Date.now();
      if (now - lastUpdateRef.current < 16) return;
      lastUpdateRef.current = now;

      const dragIdx = blocks.findIndex((b) => b.id === isDraggingId);
      if (dragIdx === -1) return;

      // 이미 마지막이면 skip
      if (dragIdx === blocks.length - 1) return;

      const newBlocks = [...blocks];
      const [draggedItem] = newBlocks.splice(dragIdx, 1);
      newBlocks.push(draggedItem);

      setBlocks(normalizeLayout(newBlocks));
      return;
    }

    // 기존 로직: 가장 가까운 블록 찾기
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

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDraggingRef.current || !gridRef.current) return;

    const targetEl = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest('[data-block-id]') as HTMLElement | null;

    if (!targetEl) return;

    const targetId = targetEl.getAttribute('data-block-id');
    if (targetId) {
      handleDragOver(e as unknown as React.DragEvent, targetId, targetEl);
    }
  };

  const handleDragEnd = useCallback(() => {
    isPointerDraggingRef.current = false;

    // Release pointer capture
    if (pointerIdRef.current !== null && capturedElementRef.current !== null) {
      try {
        capturedElementRef.current.releasePointerCapture(pointerIdRef.current);
      } catch (e) {
        // Ignore errors if pointer capture was already released
      }
      pointerIdRef.current = null;
      capturedElementRef.current = null;
    }

    if (!isDraggingId || !draftId) {
      setIsDraggingId(null);
      return;
    }
    const movedBlocks = blocks.map((block) => ({
      blockId: block.id,
      layout: block.layout,
    }));

    if (movedBlocks) {
      applyPatch?.({
        type: 'BLOCK_MOVE',
        moves: movedBlocks,
      });
    }

    setIsDraggingId(null);
  }, [isDraggingId, draftId, blocks, applyPatch]);

  // 전역 pointerup 이벤트 리스너 추가 (DOM 재배치로 인한 이벤트 손실 방지)
  useEffect(() => {
    if (!isDraggingId) return;

    const handleGlobalPointerUp = () => {
      handleDragEnd();
    };

    document.addEventListener('pointerup', handleGlobalPointerUp);
    document.addEventListener('pointercancel', handleGlobalPointerUp);

    return () => {
      document.removeEventListener('pointerup', handleGlobalPointerUp);
      document.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, [isDraggingId, handleDragEnd]);
  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('textarea') ||
      target.closest('input') ||
      target.closest('button')
    ) {
      return;
    }
    e.preventDefault();
    isPointerDraggingRef.current = true;
    handleDragStart(id);

    // Store pointerId and element for later release
    const element = e.target as HTMLElement;
    pointerIdRef.current = e.pointerId;
    capturedElementRef.current = element;
    element.setPointerCapture(e.pointerId);
  };

  return {
    gridRef,
    isDraggingId,
    handleGridDragOver,
    handleDragEnd,
    handlePointerDown,
    handlePointerMove,
  };
};
