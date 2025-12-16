'use client';

import { cn } from '@/lib/utils';
import { forwardRef, InputHTMLAttributes } from 'react';

interface SimpleInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type'
> {
  showCheckIcon?: boolean;
}

const SimpleInput = forwardRef<HTMLInputElement, SimpleInputProps>(
  ({ showCheckIcon = false, className, ...props }, ref) => {
    return (
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3 shadow-sm border border-itta-gray1 rounded-[10px] bg-white transition-all duration-200 focus-within:border-itta-black',
          className,
        )}
      >
        <input
          ref={ref}
          type="text"
          className="flex-1 outline-none text-sm placeholder:text-itta-gray3 bg-transparent"
          {...props}
        />

        {showCheckIcon && (
          <div>icon</div>
          // <Check className="w-5 h-5 text-itta-point shrink-0" />
        )}
      </div>
    );
  },
);

SimpleInput.displayName = 'SimpleInput';

export default SimpleInput;
