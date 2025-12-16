'use client';

import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

interface SearchbarProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type'
> {
  onCalendarClick?: VoidFunction;
}

const Searchbar = forwardRef<HTMLInputElement, SearchbarProps>(
  ({ onCalendarClick, className, ...props }, ref) => {
    return (
      <div
        className={cn(
          'flex items-center text-sm gap-2 px-3.5 py-2 border border-itta-gray2 rounded-[10px] bg-white',
          className,
        )}
      >
        <span>icon</span>
        {/* <Search className="w-5 h-5 text-itta-gray2 shrink-0" /> */}

        <input
          ref={ref}
          type="text"
          className="flex-1 outline-none text-sm placeholder:text-itta-gray2 bg-transparent w-full"
          {...props}
        />

        {onCalendarClick && (
          <button
            type="button"
            onClick={onCalendarClick}
            className="shrink-0 p-1 hover:bg-itta-gray2/10 rounded transition-colors"
          >
            icon
            {/* <Calendar className="w-5 h-5 text-itta-black" /> */}
          </button>
        )}
      </div>
    );
  },
);

Searchbar.displayName = 'Searchbar';

export default Searchbar;
