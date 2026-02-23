'use client';

import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { cloneElement, ReactElement, SVGProps, useState } from 'react';

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
  const [ripple, setRipple] = useState(false);

  const handleClick = () => {
    setRipple(true);
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'relative overflow-hidden flex items-center justify-center w-10 h-9 sm:w-12 sm:h-10 rounded-2xl transition-colors cursor-pointer',
        isGroup
          ? active
            ? 'text-[#10B981] dark:text-emerald-400'
            : 'text-gray-400 dark:text-gray-500'
          : active
            ? 'text-[#222222] dark:text-white'
            : 'text-gray-300 dark:text-gray-500',
      )}
    >
      <AnimatePresence>
        {ripple && (
          <motion.span
            initial={{ opacity: 0.25, scale: 0.6 }}
            animate={{ opacity: 0, scale: 2.2 }}
            exit={{}}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            onAnimationComplete={() => setRipple(false)}
            className="absolute inset-0 rounded-2xl bg-gray-400 dark:bg-gray-300 pointer-events-none"
          />
        )}
      </AnimatePresence>
      {cloneElement(icon, {
        className: 'w-5 h-5 sm:w-6 sm:h-6 relative',
        strokeWidth: active ? 2.5 : 2.2,
        fill: 'none',
        fillOpacity: active ? 0.08 : 0,
      })}
    </button>
  );
}
