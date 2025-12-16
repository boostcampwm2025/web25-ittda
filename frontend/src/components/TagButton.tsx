'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface TagProps {
  className?: string;
  onClick: VoidFunction;
  children: ReactNode;
}

export default function Tag({ children, onClick, className }: TagProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm rounded-4xl bg-white font-semibold cursor-pointer"
    >
      <div
        className={cn(
          'px-3.5 py-1 rounded-4xl border-[0.5px] border-itta-gray2 hover:bg-itta-point/20 ease-in-out hover:border-itta-point transition-all duration-300',
          className,
        )}
      >
        {children}
      </div>
    </button>
  );
}
