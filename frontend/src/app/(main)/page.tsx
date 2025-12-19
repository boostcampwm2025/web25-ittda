'use client';

import Input from '@/components/Input';
import PostList from './_components/PostList';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import SideFilterbar from './_components/SideFilterbar';
import FloatingCreateButton from '@/components/FloatingCreateButton';

export default function HomePage() {
  const { containerRef, isVisible } = useScrollDirection<HTMLElement>();

  return (
    <>
      <section
        ref={containerRef}
        className="w-full h-full px-6 pb-5 overflow-y-auto"
      >
        <div
          className={cn(
            'hidden md:block sticky top-0 z-20 bg-white py-5 transition-transform duration-300 ease-out',
            isVisible ? 'translate-y-0' : '-translate-y-[calc(100%+1.25rem)]',
          )}
        >
          <div className="w-full max-w-2xl mx-auto">
            <Input>
              <Input.Field placeholder="간단히 메모할 사항을 작성해주세요." />
              <Input.Right>
                <Check className="w-5 h-5 text-itta-point" />
              </Input.Right>
            </Input>
          </div>
          <div className="block md:hidden">
            <SideFilterbar />
          </div>
        </div>

        <PostList />
      </section>

      <FloatingCreateButton />
    </>
  );
}
