import { useEffect, useRef, useState } from 'react';

interface UseBottomSheetResizeProps {
  topOffset?: number; // PWA 배너 등의 상단 오프셋
}

// 네비게이션바 높이를 못 구했을 때(최초 페인트 이전 등)의 대략값.
const DEFAULT_NAV_HEIGHT = 80;
// 드래그 핸들 + "Explore Records" 타이틀 영역의 대략적인 높이 — collapsed
// 상태에서 최소한 이만큼은 네비게이션바 위로 보여야 헤더가 안 잘린다.
const HEADER_RESERVE = 140;
// collapsed 상태에서도 기록 카드가 살짝 보여서 "더 있다"는 게 느껴지도록.
const PEEK_ALLOWANCE = 40;

function computeSnapPoints(
  innerHeight: number,
  topOffset: number,
  navHeight: number,
) {
  // BottomNavigation과 이 드로어는 둘 다 독립적으로 fixed bottom-0이라,
  // 드로어 높이의 아래쪽 navHeight px만큼은 네비게이션바에 항상 가려진다.
  // 예전엔 Math.max(150, innerHeight*0.1) 같은 고정값이라 실측 네비게이션바
  // 높이를 고려하지 못했고, 그 결과 collapsed 상태에서 리스트 전체가
  // 네비게이션바 밑에 완전히 가려져 탭 자체가 안 되는 문제가 있었다.
  const baseCollapsed = HEADER_RESERVE + navHeight + PEEK_ALLOWANCE;
  const availableHeight = Math.max(0, innerHeight - topOffset);
  const collapsed = Math.min(baseCollapsed + topOffset, availableHeight);
  const half = Math.max(collapsed, availableHeight * 0.5);
  const full = Math.max(half, availableHeight * 0.8);
  return { collapsed, half, full };
}

function measureNavHeight() {
  return (
    document.getElementById('bottom-navigation')?.getBoundingClientRect()
      .height ?? DEFAULT_NAV_HEIGHT
  );
}

export function useBottomSheetResize({
  topOffset = 0,
}: UseBottomSheetResizeProps = {}) {
  const [snapPoints, setSnapPoints] = useState(() => {
    if (typeof window === 'undefined') {
      return { collapsed: 170, half: 500, full: 900 };
    }
    return computeSnapPoints(window.innerHeight, topOffset, measureNavHeight());
  });

  // topOffset(PWA 배너 표시 여부 등) 변화에 맞춰 재계산 — SSR 마크업이 이미
  // 붙어있는 상태라 마운트 시점에도 네비게이션바 실측이 바로 가능하다.
  useEffect(() => {
    const updateSnapPoints = () =>
      setSnapPoints(
        computeSnapPoints(window.innerHeight, topOffset, measureNavHeight()),
      );

    updateSnapPoints();
    window.addEventListener('resize', updateSnapPoints);

    const navigation = document.getElementById('bottom-navigation');
    const observer = navigation
      ? new ResizeObserver(updateSnapPoints)
      : undefined;
    observer?.observe(navigation!);

    return () => {
      window.removeEventListener('resize', updateSnapPoints);
      observer?.disconnect();
    };
  }, [topOffset]);

  const [height, setHeight] = useState(150);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHeight((currentHeight) =>
      Math.min(snapPoints.full, Math.max(snapPoints.collapsed, currentHeight)),
    );
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
