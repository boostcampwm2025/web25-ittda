'use client';

import SimpleInput from '@/components/SimpleInput';
import PostList from './_components/PostList';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { cn } from '@/lib/utils';
import SideFilterbar from './_components/SideFilterbar';

export default function HomePage() {
  const { containerRef, isVisible } = useScrollDirection<HTMLElement>();

  return (
    <section
      ref={containerRef}
      className="w-full h-full px-6 pb-5 overflow-y-auto"
    >
      <div
        className={cn(
          'sticky top-0 z-20 bg-white py-5 transition-transform duration-300 ease-out',
          isVisible ? 'translate-y-0' : '-translate-y-[calc(100%+1.25rem)]',
        )}
      >
        <div className="hidden md:block w-full max-w-2xl mx-auto">
          <SimpleInput
            showCheckIcon
            placeholder="간단히 메모할 사항을 작성해주세요."
          />
        </div>
        <div className="block md:hidden">
          <SideFilterbar />
        </div>
      </div>

      <PostList />
    </section>
  );
}
