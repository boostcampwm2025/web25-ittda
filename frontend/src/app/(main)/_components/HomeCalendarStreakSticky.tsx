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
        hidden ? 'top-0' : 'top-16 sm:top-18',
      )}
    >
      {children}
    </div>
  );
}