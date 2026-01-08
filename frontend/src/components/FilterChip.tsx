'use client';

import { X, Tag, MapPin, Calendar, LucideIcon } from 'lucide-react';

// 필터 타입
type FilterType = 'tag' | 'location' | 'date';

interface Props {
  type: FilterType;
  label: string;
  isActive: boolean;
  onClick: () => void;
  onClear: () => void;
}

// 타입별 아이콘
const iconMap: Record<FilterType, LucideIcon> = {
  tag: Tag,
  location: MapPin,
  date: Calendar,
};

export const FilterChip = ({
  type,
  label,
  isActive,
  onClick,
  onClear,
}: Props) => {
  const Icon = iconMap[type];

  return (
    <div
      className={`flex items-center shrink-0 gap-2 px-4 py-2 rounded-lg text-xs font-semibold h-9 transition-all duration-200 border ${
        isActive
          ? 'bg-itta-point border-itta-point text-white shadow-md'
          : 'border-black/[0.05] dark:bg-white/5 text-itta-gray3 hover:bg-gray-50 dark:hover:bg-white/10'
      }`}
    >
      <button
        onClick={onClick}
        className="flex items-center gap-1.5 text-[11px] font-bold active:scale-95 transition-transform"
      >
        <Icon size={13} strokeWidth={isActive ? 2.5 : 2} />
        <span>{label}</span>
      </button>

      {/* 활성화 시에만 X 버튼*/}
      {isActive && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="hover:bg-black/10 dark:hover:bg-white/20 rounded-full transition-colors"
        >
          <X size={12} strokeWidth={3} />
        </button>
      )}
    </div>
  );
};
