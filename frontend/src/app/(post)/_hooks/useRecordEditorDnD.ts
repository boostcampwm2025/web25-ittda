import { useState, useRef, useEffect, useCallback } from 'react';
import { RecordBlock } from '@/lib/types/recordField';
import { FieldType } from '@/lib/types/record';
import { normalizeLayout } from '../_utils/recordLayoutHelper';
import { PatchApplyPayload } from '@/lib/types/recordCollaboration';
import { useHaptic } from '@/hooks/useHaptic';

const LONG_PRESS_DURATION = 300; // ms — 이 시간 이상 누르고 있어야 드래그 시작
const SCROLL_CANCEL_THRESHOLD = 6; // px — 롱프레스 대기 중 이 이상 움직이면 스크롤로 판단해 취소
const MOUSE_DRAG_THRESHOLD = 6; // px — 마우스(데스크탑) 드래그 시작 이동 거리 임계값

export const useRecordEditorDnD = (
  blocks: RecordBlock[],
  setBlocks: React.Dispatch<React.SetStateAction<RecordBlock[]>>,
  canBeHalfWidth: (type: FieldType) => boolean,
  applyPatch?: (patch: PatchApplyPayload) => void,
  draftId?: string,
) => {
  const { trigger: triggerHaptic } = useHaptic();
  const [isDraggingId, setIsDraggingId] = useState<string | null>(null);
  const isDraggingIdRef = useRef<string | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const isPointerDraggingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const capturedElementRef = useRef<HTMLElement | null>(null);

  // pointer 이벤트 기반 롱프레스 대기 (non-textarea/input)
  const pendingDragRef = useRef<{
    pointerId: number;
    blockId: string;
    startX: number;
    startY: number;
    timer: ReturnType<typeof setTimeout> | null;
  } | null>(null);

  // touch 이벤트 기반 롱프레스 대기 (textarea/input — iOS pointercancel 우회)
  const pendingTouchDragRef = useRef<{
    touchId: number;
    blockId: string;
    startX: number;
    startY: number;
    timer: ReturnType<typeof setTimeout>;
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

      // 마우스(데스크탑): 타이머 없이 펜딩만 설정 — pointermove에서 움직임 기준으로 드래그 시작
      if (e.pointerType === 'mouse') {
        pendingDragRef.current = {
          pointerId: e.pointerId,
          blockId,
          startX: e.clientX,
          startY: e.clientY,
          timer: null,
        };
        return;
      }

      // 터치/펜: 기존 롱프레스 방식
      const timer = setTimeout(() => {
        if (pendingDragRef.current?.blockId === blockId) {
          // 롱프레스 완료 → 드래그 활성화
          const blockEl = document.querySelector(
            `[data-block-id="${blockId}"]`,
          ) as HTMLElement | null;
          if (blockEl) {
            try {
              blockEl.setPointerCapture(e.pointerId);
            } catch {}
            pointerIdRef.current = e.pointerId;
            capturedElementRef.current = blockEl;
          }
          triggerHaptic();
          isPointerDraggingRef.current = true;
          isDraggingIdRef.current = blockId;
          setIsDraggingId(blockId);
          pendingDragRef.current = null;
        }
      }, LONG_PRESS_DURATION);

      pendingDragRef.current = {
        pointerId: e.pointerId,
        blockId,
        startX: e.clientX,
        startY: e.clientY,
        timer,
      };
    };

    document.addEventListener('pointerdown', handleGlobalDown, {
      capture: true,
    });
    return () => {
      document.removeEventListener('pointerdown', handleGlobalDown, {
        capture: true,
      });
    };
  }, [triggerHaptic]);

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

      const timer = setTimeout(() => {
        if (pendingTouchDragRef.current?.blockId === blockId) {
          // 롱프레스 완료 → 드래그 활성화
          triggerHaptic();
          isPointerDraggingRef.current = true;
          isDraggingIdRef.current = blockId;
          setIsDraggingId(blockId);
          pendingTouchDragRef.current = null;
        }
      }, LONG_PRESS_DURATION);

      pendingTouchDragRef.current = {
        touchId: touch.identifier,
        blockId,
        startX: touch.clientX,
        startY: touch.clientY,
        timer,
      };
    };

    document.addEventListener('touchstart', handleGlobalTouchStart, {
      passive: true,
      capture: true,
    });
    return () => {
      document.removeEventListener('touchstart', handleGlobalTouchStart, {
        capture: true,
      });
    };
  }, [triggerHaptic]);

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
      const dragIdx = currentBlocks.findIndex(
        (b) => b.id === currentDraggingId,
      );
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
        const newBlocks = currentBlocks.map((b) => ({
          ...b,
          layout: { ...b.layout },
        }));
        newBlocks[dragIdx].layout.span = nextSpan;
        if (hoverNextSpan !== hoverBlock.layout.span) {
          newBlocks[hoverIdx].layout.span = hoverNextSpan;
        }
        const [draggedItem] = newBlocks.splice(dragIdx, 1);
        const adjustedIndex =
          dragIdx < insertIndex ? insertIndex - 1 : insertIndex;
        newBlocks.splice(adjustedIndex, 0, draggedItem);
        const normalizedBlocks = normalizeLayout(newBlocks);
        // 전역 pointerup은 React 렌더/effect보다 먼저 올 수 있으므로 ref도 즉시 갱신한다.
        // 그렇지 않으면 handleDragEnd가 이동 전 레이아웃을 PATCH로 보낼 수 있다.
        blocksRef.current = normalizedBlocks;
        setBlocks(normalizedBlocks);
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
          const normalizedBlocks = normalizeLayout(newBlocks);
          blocksRef.current = normalizedBlocks;
          setBlocks(normalizedBlocks);
        }
        return;
      }

      const targetId = targetEl.getAttribute('data-block-id');
      if (targetId) handleDragOver(clientX, clientY, targetId, targetEl);
    };

    // pointer 이벤트 기반 drag (non-textarea/input)
    const handleGlobalMove = (e: PointerEvent) => {
      if (
        pendingDragRef.current &&
        e.pointerId === pendingDragRef.current.pointerId
      ) {
        const dx = e.clientX - pendingDragRef.current.startX;
        const dy = e.clientY - pendingDragRef.current.startY;
        const distSq = dx * dx + dy * dy;

        if (e.pointerType === 'mouse') {
          // 마우스(데스크탑): 움직임 임계값 초과 시 즉시 드래그 활성화
          if (distSq > MOUSE_DRAG_THRESHOLD * MOUSE_DRAG_THRESHOLD) {
            const { blockId } = pendingDragRef.current;
            const el = document.querySelector(
              `[data-block-id="${blockId}"]`,
            ) as HTMLElement | null;
            if (el) {
              try {
                el.setPointerCapture(e.pointerId);
              } catch {}
              pointerIdRef.current = e.pointerId;
              capturedElementRef.current = el;
            }
            isPointerDraggingRef.current = true;
            isDraggingIdRef.current = blockId;
            setIsDraggingId(blockId);
            pendingDragRef.current = null;
          }
          return;
        }

        // 터치/펜: 롱프레스 대기 중 스크롤 의도 감지 → 타이머 취소
        if (distSq > SCROLL_CANCEL_THRESHOLD * SCROLL_CANCEL_THRESHOLD) {
          if (pendingDragRef.current.timer)
            clearTimeout(pendingDragRef.current.timer);
          pendingDragRef.current = null;
        }
        return;
      }

      processDragOver(e.clientX, e.clientY);
    };

    // touch 이벤트 기반 drag (textarea/input — iOS pointercancel 우회)
    const handleGlobalTouchMove = (e: TouchEvent) => {
      const touch =
        Array.from(e.changedTouches).find((t) =>
          pendingTouchDragRef.current
            ? t.identifier === pendingTouchDragRef.current.touchId
            : false,
        ) ?? (isPointerDraggingRef.current ? e.touches[0] : null);

      if (!touch) return;

      if (
        pendingTouchDragRef.current &&
        touch.identifier === pendingTouchDragRef.current.touchId
      ) {
        const dx = touch.clientX - pendingTouchDragRef.current.startX;
        const dy = touch.clientY - pendingTouchDragRef.current.startY;
        // 롱프레스 대기 중 스크롤 의도 감지 → 타이머 취소
        if (
          dx * dx + dy * dy >
          SCROLL_CANCEL_THRESHOLD * SCROLL_CANCEL_THRESHOLD
        ) {
          clearTimeout(pendingTouchDragRef.current.timer);
          pendingTouchDragRef.current = null;
        }
        return;
      }

      if (isPointerDraggingRef.current && isDraggingIdRef.current) {
        e.preventDefault();
        processDragOver(touch.clientX, touch.clientY);
      }
    };

    const handleGlobalUp = (e: PointerEvent) => {
      if (
        pendingDragRef.current &&
        e.pointerId === pendingDragRef.current.pointerId
      ) {
        clearTimeout(pendingDragRef.current.timer ?? undefined);
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
        clearTimeout(pendingTouchDragRef.current.timer);
        pendingTouchDragRef.current = null;
      }
    };

    document.addEventListener('pointermove', handleGlobalMove, {
      passive: true,
    });
    document.addEventListener('touchmove', handleGlobalTouchMove, {
      passive: false,
    });
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
    if (pendingDragRef.current) {
      clearTimeout(pendingDragRef.current.timer ?? undefined);
      pendingDragRef.current = null;
    }
    if (pendingTouchDragRef.current) {
      clearTimeout(pendingTouchDragRef.current.timer);
      pendingTouchDragRef.current = null;
    }
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
      document.addEventListener('click', suppressClick, {
        capture: true,
        once: true,
      });
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
