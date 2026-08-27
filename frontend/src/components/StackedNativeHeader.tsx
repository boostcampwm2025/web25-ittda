'use client';

import { useEffect, useRef, useState } from 'react';

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
  const headerRef = useRef<HTMLElement>(null);
  const [isStuck, setIsStuck] = useState(false);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsStuck(entry.intersectionRatio < 1),
      { threshold: [1], rootMargin: '-1px 0px 0px 0px' },
    );
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  return (
    <header
      ref={headerRef}
      id={id}
      data-stacked-header={isStuck ? undefined : true}
      className={className}
    >
      {children}
    </header>
  );
}