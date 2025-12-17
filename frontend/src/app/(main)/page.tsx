'use client';

import PostList from './_components/PostList';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const { containerRef, isVisible } = useScrollDirection<HTMLElement>();

  return (
    <section
      ref={containerRef}
      className="w-full h-full px-6 py-5 overflow-y-auto"
    >
      <div
        className={cn(
          'sticky top-0 z-20 bg-white transition-transform duration-300 ease-out',
          isVisible ? 'translate-y-0' : '-translate-y-full',
          // translate-y 클래스를 토글해 UI 애니메이션을 구현
        )} // 스크롤 시 헤더 숨김/표시" 패턴
      ></div>

      <PostList />
    </section>
  );
}
