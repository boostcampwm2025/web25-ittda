import { LucideIcon } from 'lucide-react';

interface CategoryChipProps {
  label: string;
  Icon: LucideIcon;
  isActive: boolean;
  onClick: () => void;
  layout?: 'v' | 'h';
}

export const CategoryChip = ({
  label,
  Icon,
  isActive,
  onClick,
  layout = 'v',
}: CategoryChipProps) => {
  if (layout === 'h') {
    // 검색용 가로형 스타일
    return (
      <button
        onClick={onClick}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-bold transition-all active:scale-95 ${
          isActive
            ? 'bg-[#10B981] border-[#10B981] text-white shadow-md'
            : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-400 dark:text-gray-500 hover:bg-gray-50'
        }`}
      >
        <Icon className="w-3.5 h-3.5" />
        <span>{label}</span>
      </button>
    );
  }

  // 직접 입력의 세로형 스타일
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border transition-all active:scale-95 ${
        isActive
          ? 'bg-[#10B981]/5 border-[#10B981] text-[#10B981] ring-1 ring-[#10B981]'
          : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-400 dark:text-gray-500 hover:bg-gray-100'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
};
