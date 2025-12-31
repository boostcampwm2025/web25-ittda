import { cn } from '@/lib/utils';
import { cloneElement, ReactElement, SVGProps } from 'react';

interface NavItemProps {
  icon: ReactElement<SVGProps<SVGSVGElement>>;
  active: boolean;
  onClick: VoidFunction;
  isGroup?: boolean;
}

export default function NavItem({
  icon,
  active,
  onClick,
  isGroup,
}: NavItemProps) {
  // 그룹 페이지일 경우 활성 아이콘은 그린(#10B981)으로 표시
  return (
    <button
      onClick={onClick}
      className={cn(
        'p-2 transition-all rounded-xl',
        active
          ? 'dark:text-white text-[#222222]'
          : 'dark:text-gray-500 text-gray-300 hover:text-gray-400',

        isGroup && active && 'text-[#10B981]',
      )}
    >
      {cloneElement(icon, {
        className: 'w-6 h-6',
        strokeWidth: active ? 2.5 : 2.2,
        fill: 'none',
        fillOpacity: active ? 0.08 : 0,
      })}
    </button>
  );
}
