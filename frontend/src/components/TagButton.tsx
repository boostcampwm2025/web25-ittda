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
      onClick={onClick}
      className="text-sm shadow-sm rounded-4xl bg-white font-semibold cursor-pointer border-[0.5px] border-itta-gray1 hover:border-itta-point transition-all duration-300 ease-in-out"
    >
      <div
        className={cn(
          'px-3.5 py-1 rounded-4xl hover:bg-itta-point/20 ease-in-out transition-all duration-300',
          className,
        )}
      >
        {children}
      </div>
    </button>
  );
}
