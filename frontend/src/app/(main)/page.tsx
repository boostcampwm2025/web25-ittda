'use client';

import SimpleInput from '@/components/SimpleInput';
import SimpleMemo from './_components/SimpleMemo';
import PostList from './_components/PostList';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const { containerRef, isVisible } = useScrollDirection<HTMLElement>();

  return (
    <main
      ref={containerRef}
      className="w-full h-full px-6 pt-5 overflow-y-auto"
    >
      <div
        className={cn(
          'sticky top-0 z-20 bg-white transition-transform duration-300 ease-out',
          isVisible ? 'translate-y-0' : '-translate-y-full',
        )}
      ></div>

      <PostList />
    </main>
  );
}
