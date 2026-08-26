'use client';

import { useHideOnScroll } from '@/hooks/useHideOnScroll';

interface StackedNativeHeaderProps {
  id?: string;
  className: string;
  children: React.ReactNode;
}

export default function StackedNativeHeader({
  id,
  className,
  children,
}: StackedNativeHeaderProps) {
  const hidden = useHideOnScroll();

  return (
    <header
      id={id}
      data-stacked-header={hidden ? undefined : true}
      className={className}
    >
      {children}
    </header>
  );
}