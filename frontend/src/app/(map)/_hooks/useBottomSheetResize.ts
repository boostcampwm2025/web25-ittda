import { useEffect, useMemo, useRef, useState } from 'react';

export function useBottomSheetResize() {
  // 각 window.innerHeight 을 기반으로 최소/최대 조정하기 위함
  const snapPoints = useMemo(() => {
    if (typeof window === 'undefined') {
      return { collapsed: 170, half: 500, full: 900 };
    }
    // collapsed 높이를 네비게이션바(약 64-80px) + 충분한 여유를 고려하여 설정
    return {
      collapsed: Math.max(150, window.innerHeight * 0.175),
      half: window.innerHeight * 0.5,
      full: window.innerHeight * 0.92,
    };
  }, []);

  const [height, setHeight] = useState(150);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setHeight(snapPoints.collapsed);
  }, [snapPoints]);

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
    const nextHeight = startH.current + delta;
    // drawer가 너무 내려가지 않도록 최소 높이 제한 (collapsed의 40%)
    const minHeight = Math.max(150, snapPoints.collapsed * 0.6);
    setHeight(Math.max(minHeight, Math.min(snapPoints.full, nextHeight)));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);

    // 현재 높이와 가장 가까운 snap point로 스냅
    setHeight((prev) => {
      // collapsed의 70% 이하로 내려가면 무조건 collapsed로 스냅
      if (prev < snapPoints.collapsed * 0.7) {
        return snapPoints.collapsed;
      }

      const points = [snapPoints.collapsed, snapPoints.half, snapPoints.full];
      const closest = points.reduce((closestPoint, point) =>
        Math.abs(point - prev) < Math.abs(closestPoint - prev)
          ? point
          : closestPoint,
      );
      return closest;
    });
  };

  const snapTo = (point: 'collapsed' | 'half' | 'full') => {
    setHeight(snapPoints[point]);
  };

  return {
    height,
    setHeight,
    isDragging,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    snapTo,
  };
}
