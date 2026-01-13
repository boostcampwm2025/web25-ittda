import { useRef, useState } from 'react';

const getSnapPoints = () => ({
  collapsed: window.innerHeight * 0.25,
  half: window.innerHeight * 0.5,
  full: window.innerHeight * 0.92,
});

type SnapPoints = ReturnType<typeof getSnapPoints>;

export function useBottomSheet(snapPoints: SnapPoints) {
  const [height, setHeight] = useState(snapPoints.collapsed);
  const [isDragging, setIsDragging] = useState(false);

  const startY = useRef(0);
  const startH = useRef(0);

  const onPointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    startY.current = e.clientY;
    startH.current = height;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const delta = startY.current - e.clientY;
    const nextHeight = Math.max(
      snapPoints.collapsed,
      Math.min(snapPoints.full, startH.current + delta),
    );
    setHeight(nextHeight);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return {
    height,
    setHeight,
    isDragging,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };
}
