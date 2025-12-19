'use client';

import { cn } from '@/lib/utils';
import { useEffect, useLayoutEffect, useRef } from 'react';

interface ScrollColumnProps {
  list: string[];
  current: string;
  onValueChange: (newValue: string) => void;
}

const ITEM_HEIGHT = 36;
const CONTAINER_HEIGHT = 160;
const SCROLL_PADDING = CONTAINER_HEIGHT / 2 - ITEM_HEIGHT / 2;

export default function ScrollColumn({
  list,
  current,
  onValueChange,
}: ScrollColumnProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isWheeling = useRef(false); // 휠 이벤트 중복 실행 방지용

  const centerIndex = list.findIndex((item) => String(item) === current);

  // 초기 위치 설정
  useLayoutEffect(() => {
    const node = scrollRef.current;
    if (!node || centerIndex === -1) return;
    node.scrollTop = centerIndex * ITEM_HEIGHT;
  }, []);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault(); // 브라우저의 기본 스크롤 차단

      if (isWheeling.current) return; // 이미 이동 중이면 무시

      const direction = e.deltaY > 0 ? 1 : -1; // 휠 방향 확인
      const nextIndex = centerIndex + direction;

      // 리스트 범위를 벗어나지 않을 때만 이동
      if (nextIndex >= 0 && nextIndex < list.length) {
        isWheeling.current = true;

        onValueChange(list[nextIndex]);

        node.scrollTo({
          top: nextIndex * ITEM_HEIGHT,
          behavior: 'smooth',
        });

        // 100ms 후에 다시 휠을 입력받음 (연속 스크롤 속도 조절)
        setTimeout(() => {
          isWheeling.current = false;
        }, 100);
      }
    };

    // passive: false를 주어야 e.preventDefault()가 작동함
    node.addEventListener('wheel', handleWheel, { passive: false });
    return () => node.removeEventListener('wheel', handleWheel);
  }, [centerIndex, list, onValueChange]);

  const handleItemClick = (index: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: index * ITEM_HEIGHT,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div
      className="h-40 w-20 overflow-hidden"
      style={{ perspective: '1000px' }}
    >
      <div
        ref={scrollRef}
        className="h-full overflow-y-auto scrollbar-hide"
        style={{
          paddingTop: `${SCROLL_PADDING}px`,
          paddingBottom: `${SCROLL_PADDING}px`,
          transformStyle: 'preserve-3d',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          scrollSnapType: 'none',
        }}
      >
        {list.map((item, index) => {
          const distance = index - centerIndex;
          const absDistance = Math.abs(distance);
          const rotateX = distance * 22;
          const translateZ = -absDistance * 12;
          const opacity = Math.max(0.3, 1 - absDistance * 0.35);

          return (
            <div
              key={`${item}-${index}`}
              className={cn(
                'flex items-center justify-center cursor-pointer transition-all duration-150',
                index === centerIndex
                  ? 'font-medium text-itta-black scale-105'
                  : 'text-itta-gray3',
              )}
              style={{
                height: `${ITEM_HEIGHT}px`,
                transform: `rotateX(${-rotateX}deg) translateZ(${translateZ}px)`,
                opacity: opacity,
                backfaceVisibility: 'hidden',
              }}
              onClick={() => handleItemClick(index)}
            >
              {item}
            </div>
          );
        })}
      </div>
    </div>
  );
}
