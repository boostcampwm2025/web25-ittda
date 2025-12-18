'use client';

import { cn } from '@/lib/utils';
import { useLayoutEffect, useRef } from 'react';

interface ScrollColumnProps {
  list: string[];
  current: string;
  onValueChange: (newValue: string) => void;
}

const ITEM_HEIGHT = 36;
const CONTAINER_HEIGHT = 192;
const SCROLL_PADDING = CONTAINER_HEIGHT / 2 - ITEM_HEIGHT / 2;

export default function ScrollColumn({
  list,
  current,
  onValueChange,
}: ScrollColumnProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const centerIndex = list.findIndex((item) => String(item) === current);

  // 초기 위치 설정
  useLayoutEffect(() => {
    const node = scrollRef.current;
    if (!node) return;

    const timeoutId = setTimeout(() => {
      node.scrollTop = centerIndex * ITEM_HEIGHT;
    }, 0);

    return () => clearTimeout(timeoutId);
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    let index = Math.round(scrollTop / ITEM_HEIGHT);
    index = Math.max(0, Math.min(index, list.length - 1));

    const newValue = String(list[index]);
    if (newValue !== current) {
      onValueChange(newValue);
    }
  };

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
      className="h-48 w-20 overflow-hidden"
      style={{ perspective: '1000px' }}
    >
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide"
        style={{
          paddingTop: `${SCROLL_PADDING}px`,
          paddingBottom: `${SCROLL_PADDING}px`,
          transformStyle: 'preserve-3d',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        {list.map((item, index) => {
          const distance = index - centerIndex;
          const absDistance = Math.abs(distance);
          const rotateX = distance * 20;
          const translateZ = -absDistance * 15;
          const opacity = Math.max(0.3, 1 - absDistance * 0.3);

          return (
            <div
              key={`${item}-${index}`}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              className={cn(
                'flex items-center justify-center snap-center cursor-pointer transition-all duration-150',
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
