'use client';

import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResetDefaultCoverButtonProps {
  onClick?: () => void;
  label?: string;
  className?: string;
}

export function ResetDefaultCoverButton({
  onClick,
  label = '기본값으로 변경',
  className,
}: ResetDefaultCoverButtonProps) {
  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    } else {
      //TODO: 커버 기본 변경
    }
  };

  return (
    <button
      onClick={handleAction}
      className={cn(
        'flex items-center justify-center gap-2 w-full py-3 md:py-4 rounded-2xl font-bold text-sm transition-all active:scale-95',
        'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-white/5',
        className,
      )}
    >
      <RotateCcw size={16} className="text-gray-400" />
      {label}
    </button>
  );
}
