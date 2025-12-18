'use client';

import { ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingScrollButtonProps {
  show: boolean;
  direction: 'up' | 'down';
  onClick: () => void;
}

export default function FloatingScrollButton({
  show,
  direction,
  onClick,
}: FloatingScrollButtonProps) {
  console.log('show', show);
  if (!show) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed right-8 bg-white border border-itta-gray2 rounded-full p-3 shadow-lg',
        'hover:bg-itta-gray1/30 transition-all duration-300 ease-out z-30',
        'hover:scale-110 active:scale-95',
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        direction === 'up' ? 'bottom-8' : 'bottom-20',
      )}
      aria-label={direction === 'up' ? '맨 위로 가기' : '맨 아래로 가기'}
    >
      {direction === 'up' ? (
        <ArrowUp className="w-6 h-6 text-itta-black" />
      ) : (
        <ArrowDown className="w-6 h-6 text-itta-black" />
      )}
    </button>
  );
}
