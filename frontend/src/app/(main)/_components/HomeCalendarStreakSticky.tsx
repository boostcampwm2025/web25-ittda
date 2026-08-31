'use client';

import { useHideOnScroll } from '@/hooks/useHideOnScroll';
import { cn } from '@/lib/utils';

export default function HomeCalendarStreakSticky({
  children,
}: {
  children: React.ReactNode;
}) {
  const hidden = useHideOnScroll();

  return (
    <div
      id="streak-stats-sticky"
      className={cn(
        'sticky z-40 overflow-hidden',
        'bg-white dark:bg-[#121212]',
        hidden
          ? 'top-0'
          : 'top-[calc(4rem+var(--cap-status-bar-height,env(safe-area-inset-top)))] sm:top-[calc(4.5rem+var(--cap-status-bar-height,env(safe-area-inset-top)))]',
      )}
    >
      {children}
    </div>
  );
}