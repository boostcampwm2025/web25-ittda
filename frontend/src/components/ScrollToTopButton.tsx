'use client';

import FloatingScrollButton from './FloatingScrollButton';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { cn } from '@/lib/utils';

export default function ScrollToTopButton({
  stackedAboveDraftButton = false,
}: {
  stackedAboveDraftButton?: boolean;
}) {
  const { show, scrollToTop } = useScrollToTop();

  return (
    <div
      className={cn(
        'fixed left-0 right-0 max-w-4xl mx-auto w-full flex justify-end pr-4 sm:pr-6 pointer-events-none',
        stackedAboveDraftButton
          ? 'bottom-32 sm:bottom-44'
          : 'bottom-16 sm:bottom-24',
      )}
    >
      <FloatingScrollButton
        show={show}
        onClick={scrollToTop}
        className="static pointer-events-auto bg-white/90 text-itta-black border border-gray-100 shadow-md backdrop-blur-xl hover:shadow-lg dark:bg-[#1E1E1E]/90 dark:text-white dark:border-white/10 dark:shadow-none"
      />
    </div>
  );
}
