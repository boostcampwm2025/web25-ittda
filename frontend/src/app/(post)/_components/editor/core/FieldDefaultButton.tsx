'use client';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FieldDefaultButtonProps {
  children: ReactNode;
  onClick: () => void;
  className?: string;
}

function FieldDefaultButton({
  children,
  onClick,
  className,
}: FieldDefaultButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group/placeholder flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed transition-all active:scale-95 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5',
        className,
      )}
    >
      {children}
    </button>
  );
}

// Icon 컴포넌트
function FieldDefaultButtonIcon({
  icon: Icon,
  className,
}: {
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <Icon
      className={cn(
        'w-3.5 h-3.5 text-gray-400 group-hover/placeholder:text-[#10B981] transition-colors',
        className,
      )}
    />
  );
}

// Label 컴포넌트
function FieldDefaultButtonLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-[11px] font-bold text-gray-400 group-hover/placeholder:text-gray-600 dark:group-hover/placeholder:text-gray-200 transition-colors">
      {children}
    </span>
  );
}

export { FieldDefaultButton, FieldDefaultButtonIcon, FieldDefaultButtonLabel };
