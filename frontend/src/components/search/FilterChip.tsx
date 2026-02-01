'use client';

import { X, Tag, MapPin, Calendar, LucideIcon, SmileIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// 필터 타입
type FilterType = 'tag' | 'location' | 'date' | 'emotion';

interface Props {
  type: FilterType;
  label: string;
  isActive: boolean;
  onClick: () => void;
  onClear: () => void;
  className?: string;
}

// 타입별 아이콘
const iconMap: Record<FilterType, LucideIcon> = {
  tag: Tag,
  location: MapPin,
  date: Calendar,
  emotion: SmileIcon,
};

export const FilterChip = ({
  type,
  label,
  isActive,
  onClick,
  onClear,
  className,
}: Props) => {
  const Icon = iconMap[type];

  return (
    <button
      type="button"
      className={cn(
        'flex items-center shrink-0 gap-2 px-4 py-2 rounded-lg text-xs font-semibold h-9 transition-all duration-200 border',
        isActive
          ? 'bg-itta-point border-itta-point text-white shadow-md'
          : 'border-black/[0.05] bg-white dark:bg-[#1E1E1E] text-itta-gray3 hover:bg-gray-50 dark:hover:bg-black/100',
        className,
      )}
    >
      <div
        onClick={onClick}
        className="flex items-center gap-1.5 text-[11px] font-bold active:scale-95 transition-transform"
      >
        <Icon size={13} strokeWidth={isActive ? 2.5 : 2} />
        <span className="truncate max-w-[100px]">{label}</span>
      </div>

      {isActive && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="hover:bg-black/10 dark:hover:bg-white/20 rounded-full transition-colors p-0.5"
        >
          <X size={12} strokeWidth={3} />
        </div>
      )}
    </button>
  );
};
