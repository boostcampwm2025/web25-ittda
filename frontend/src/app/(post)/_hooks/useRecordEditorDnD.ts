import { useState, useRef, useEffect, useCallback } from 'react';
import { RecordBlock } from '@/lib/types/recordField';
import { FieldType } from '@/lib/types/record';
import { normalizeLayout } from '../_utils/recordLayoutHelper';
import { PatchApplyPayload } from '@/lib/types/recordCollaboration';

const DRAG_THRESHOLD = 8;

export const useRecordEditorDnD = (
  blocks: RecordBlock[],
  setBlocks: React.Dispatch<React.SetStateAction<RecordBlock[]>>,
  canBeHalfWidth: (type: FieldType) => boolean,
  applyPatch?: (patch: PatchApplyPayload) => void,
  draftId?: string,
) => {
  const [isDraggingId, setIsDraggingId] = useState<string | null>(null);
  const isDraggingIdRef = useRef<string | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const isPointerDraggingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const capturedElementRef = useRef<HTMLElement | null>(null);

  // pointer 이벤트 기반 드래그 대기 (non-textarea/input)
  const pendingDragRef = useRef<{
    pointerId: number;
    blockId: string;
    startX: number;
    startY: number;
  } | null>(null);

  // touch 이벤트 기반 드래그 대기 (textarea/input — iOS pointercancel 우회)
  const pendingTouchDragRef = useRef<{
    touchId: number;
    blockId: string;
    startX: number;
    startY: number;
  } | null>(null);

  // blocks를 ref로 미러링 — 전역 listener에서 항상 최신 값 참조
  const blocksRef = useRef(blocks);
  useEffect(() => {
    blocksRef.current = blocks;
  });

  // 전역 pointerdown: non-textarea/input 블록 드래그 감지
  useEffect(() => {
    const handleGlobalDown = (e: PointerEvent) => {
      if (isPointerDraggingRef.current) return;

      const target = e.target as HTMLElement;
      // textarea/input은 touchstart 경로에서 처리 (iOS pointercancel 우회)
      if (target.closest('textarea') || target.closest('input')) return;

      const blockEl = target.closest('[data-block-id]') as HTMLElement | null;
      if (!blockEl) return;
      const blockId = blockEl.getAttribute('data-block-id');
      if (!blockId) return;

      pendingDragRef.current = {
        pointerId: e.pointerId,
        blockId,
        startX: e.clientX,
        startY: e.clientY,
      };
    };

    document.addEventListener('pointerdown', handleGlobalDown, { capture: true });
    return () => {
      document.removeEventListener('pointerdown', handleGlobalDown, { capture: true });
    };
  }, []);

  // 전역 touchstart: textarea/input 블록 드래그 감지 (iOS pointercancel 우회)
  useEffect(() => {
    const handleGlobalTouchStart = (e: TouchEvent) => {
      if (isPointerDraggingRef.current) return;

      const target = e.target as HTMLElement;
      if (!target.closest('textarea') && !target.closest('input')) return;

      const blockEl = target.closest('[data-block-id]') as HTMLElement | null;
      if (!blockEl) return;
      const blockId = blockEl.getAttribute('data-block-id');
      if (!blockId) return;

      const touch = e.changedTouches[0];
      if (!touch) return;

      pendingTouchDragRef.current = {
        touchId: touch.identifier,
        blockId,
        startX: touch.clientX,
        startY: touch.clientY,
      };
    };

    document.addEventListener('touchstart', handleGlobalTouchStart, {
      passive: true,
      capture: true,
    });
    return () => {
      document.removeEventListener('touchstart', handleGlobalTouchStart, { capture: true });
    };
  }, []);

  // 전역 pointermove + touchmove: threshold 감지 + drag-over 로직 통합
  useEffect(() => {
    const handleDragOver = (
      clientX: number,
      clientY: number,
      targetId: string,
      targetEl: HTMLElement,
    ) => {
      const currentDraggingId = isDraggingIdRef.current;
      if (!currentDraggingId || currentDraggingId === targetId) return;

      const now = Date.now();
      if (now - lastUpdateRef.current < 16) return;
      lastUpdateRef.current = now;

      const currentBlocks = blocksRef.current;
      const dragIdx = currentBlocks.findIndex((b) => b.id === currentDraggingId);
      const hoverIdx = currentBlocks.findIndex((b) => b.id === targetId);
      if (dragIdx === -1 || hoverIdx === -1) return;

      const rect = targetEl.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const draggingBlock = currentBlocks[dragIdx];
      const hoverBlock = currentBlocks[hoverIdx];

      let nextSpan = draggingBlock.layout.span;
      let hoverNextSpan = hoverBlock.layout.span;
      let insertIndex = hoverIdx;

      const isHalfWidthCapable = canBeHalfWidth(draggingBlock.type);
      const isRightHalf = x > rect.width / 2;
      const isBottomHalf = y > rect.height / 2;
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
        const newBlocks = [...currentBlocks];
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

    const processDragOver = (clientX: number, clientY: number) => {
      if (!isPointerDraggingRef.current || !isDraggingIdRef.current) return;

      const targetEl = document
        .elementFromPoint(clientX, clientY)
        ?.closest('[data-block-id]') as HTMLElement | null;

      if (!targetEl) {
        if (!gridRef.current) return;
        const elements = Array.from(
          gridRef.current.querySelectorAll<HTMLElement>('[data-block-id]'),
        );
        if (elements.length === 0) return;
        const lastRect = elements[elements.length - 1].getBoundingClientRect();
        if (clientY > lastRect.bottom + 10) {
          const now = Date.now();
          if (now - lastUpdateRef.current < 16) return;
          lastUpdateRef.current = now;
          const currentBlocks = blocksRef.current;
          const dragIdx = currentBlocks.findIndex(
            (b) => b.id === isDraggingIdRef.current,
          );
          if (dragIdx === -1 || dragIdx === currentBlocks.length - 1) return;
          const newBlocks = [...currentBlocks];
          const [draggedItem] = newBlocks.splice(dragIdx, 1);
          newBlocks.push(draggedItem);
          setBlocks(normalizeLayout(newBlocks));
        }
        return;
      }

      const targetId = targetEl.getAttribute('data-block-id');
      if (targetId) handleDragOver(clientX, clientY, targetId, targetEl);
    };

    // pointer 이벤트 기반 drag (non-textarea/input)
    const handleGlobalMove = (e: PointerEvent) => {
      if (pendingDragRef.current && e.pointerId === pendingDragRef.current.pointerId) {
        const dx = e.clientX - pendingDragRef.current.startX;
        const dy = e.clientY - pendingDragRef.current.startY;
        if (dx * dx + dy * dy > DRAG_THRESHOLD * DRAG_THRESHOLD) {
          const { pointerId, blockId } = pendingDragRef.current;
          const blockEl = document.querySelector(
            `[data-block-id="${blockId}"]`,
          ) as HTMLElement | null;
          if (blockEl) {
            try {
              blockEl.setPointerCapture(pointerId);
            } catch {}
            pointerIdRef.current = pointerId;
            capturedElementRef.current = blockEl;
          }
          isPointerDraggingRef.current = true;
          isDraggingIdRef.current = blockId;
          setIsDraggingId(blockId);
          pendingDragRef.current = null;
        } else {
          return;
        }
      }

      processDragOver(e.clientX, e.clientY);
    };

    // touch 이벤트 기반 drag (textarea/input — iOS pointercancel 우회)
    const handleGlobalTouchMove = (e: TouchEvent) => {
      const touch = Array.from(e.changedTouches).find(
        (t) =>
          pendingTouchDragRef.current
            ? t.identifier === pendingTouchDragRef.current.touchId
            : false,
      ) ?? (isPointerDraggingRef.current ? e.touches[0] : null);

      if (!touch) return;

      if (pendingTouchDragRef.current && touch.identifier === pendingTouchDragRef.current.touchId) {
        const dx = touch.clientX - pendingTouchDragRef.current.startX;
        const dy = touch.clientY - pendingTouchDragRef.current.startY;
        if (dx * dx + dy * dy > DRAG_THRESHOLD * DRAG_THRESHOLD) {
          e.preventDefault();
          const { blockId } = pendingTouchDragRef.current;
          isPointerDraggingRef.current = true;
          isDraggingIdRef.current = blockId;
          setIsDraggingId(blockId);
          pendingTouchDragRef.current = null;
        } else {
          return;
        }
      }

      if (isPointerDraggingRef.current && isDraggingIdRef.current) {
        e.preventDefault();
        processDragOver(touch.clientX, touch.clientY);
      }
    };

    const handleGlobalUp = (e: PointerEvent) => {
      if (pendingDragRef.current && e.pointerId === pendingDragRef.current.pointerId) {
        pendingDragRef.current = null;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (
        pendingTouchDragRef.current &&
        Array.from(e.changedTouches).some(
          (t) => t.identifier === pendingTouchDragRef.current?.touchId,
        )
      ) {
        pendingTouchDragRef.current = null;
      }
    };

    document.addEventListener('pointermove', handleGlobalMove, { passive: true });
    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    document.addEventListener('pointerup', handleGlobalUp);
    document.addEventListener('pointercancel', handleGlobalUp);
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      document.removeEventListener('pointermove', handleGlobalMove);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('pointerup', handleGlobalUp);
      document.removeEventListener('pointercancel', handleGlobalUp);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [canBeHalfWidth, setBlocks]);

  const handleDragEnd = useCallback(() => {
    pendingDragRef.current = null;
    pendingTouchDragRef.current = null;
    isPointerDraggingRef.current = false;

    if (pointerIdRef.current !== null && capturedElementRef.current !== null) {
      try {
        capturedElementRef.current.releasePointerCapture(pointerIdRef.current);
      } catch {}
      pointerIdRef.current = null;
      capturedElementRef.current = null;
    }

    // 드래그 후 synthesize되는 click 이벤트 차단
    if (isDraggingIdRef.current) {
      const suppressClick = (e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
      };
      document.addEventListener('click', suppressClick, { capture: true, once: true });
      setTimeout(() => {
        document.removeEventListener('click', suppressClick, { capture: true });
      }, 300);
    }

    const wasDragging = isDraggingIdRef.current;
    isDraggingIdRef.current = null;
    setIsDraggingId(null);

    if (!wasDragging || !draftId) return;

    const movedBlocks = blocksRef.current.map((block) => ({
      blockId: block.id,
      layout: block.layout,
    }));
    applyPatch?.({
      type: 'BLOCK_MOVE',
      moves: movedBlocks,
    });
  }, [draftId, applyPatch]);

  // 전역 pointerup/touchend: DOM 재배치로 인한 이벤트 손실 방지
  useEffect(() => {
    if (!isDraggingId) return;

    document.addEventListener('pointerup', handleDragEnd);
    document.addEventListener('pointercancel', handleDragEnd);
    document.addEventListener('touchend', handleDragEnd);

    return () => {
      document.removeEventListener('pointerup', handleDragEnd);
      document.removeEventListener('pointercancel', handleDragEnd);
      document.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDraggingId, handleDragEnd]);

  // handleGridDragOver: 마우스 드래그 API용 (pointer 이벤트와 병행)
  const handleGridDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    const targetEl = (e.target as HTMLElement).closest(
      '[data-block-id]',
    ) as HTMLElement | null;
    if (targetEl) return;

    if (!gridRef.current) return;
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
      if (id) e.preventDefault();
    }
  };

  return {
    gridRef,
    isDraggingId,
    handleGridDragOver,
    handleDragEnd,
  };
};
