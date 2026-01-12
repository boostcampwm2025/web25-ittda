'use client';

import { LucideIcon } from 'lucide-react';

interface FieldDefaultButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  className?: string;
}

// 에디터에서 템플릿 불러올 때 기본으로 추가될 필드 버튼
const FieldDefaultButton = ({
  icon: Icon,
  label,
  onClick,
  className = '',
}: FieldDefaultButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`
        group/placeholder flex items-center gap-2 px-3 py-2 
        rounded-lg border border-dashed transition-all active:scale-95 
        border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5
        ${className}
      `}
    >
      <Icon className="w-3.5 h-3.5 text-gray-400 group-hover/placeholder:text-[#10B981] transition-colors" />

      <span className="text-[11px] font-bold text-gray-400 group-hover/placeholder:text-gray-600 dark:group-hover/placeholder:text-gray-200 transition-colors">
        {label}
      </span>
    </button>
  );
};

export default FieldDefaultButton;
