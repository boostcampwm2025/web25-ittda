'use client';

import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CSSProperties } from 'react';

interface FloatingScrollButtonProps {
  show: boolean;
  onClick: () => void;
  className?: string;
  style?: CSSProperties;
}

export default function FloatingScrollButton({
  show,
  onClick,
  className,
  style,
}: FloatingScrollButtonProps) {
  if (!show) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="맨 위로 이동"
      className={cn(
        'fixed right-4 md:right-6 z-30 flex items-center justify-center w-11 h-11 rounded-full bg-itta-black text-white shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95',
        className,
      )}
      style={style}
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}
