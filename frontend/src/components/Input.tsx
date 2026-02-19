'use client';

import { cn } from '@/lib/utils';
import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';

interface InputRootProps {
  className?: string;
  children: ReactNode;
}

interface InputSubComponentProps {
  children: ReactNode;
  className?: string;
}

type InputFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

function InputRoot({ className, children }: InputRootProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2 shadow-sm border border-itta-gray1 rounded-[10px] bg-white',
        className,
      )}
    >
      {children}
    </div>
  );
}

function InputLeft({ children, className }: InputSubComponentProps) {
  return (
    <div className={cn('flex items-center shrink-0', className)}>
      {children}
    </div>
  );
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="text"
        className={cn(
          'flex-1 outline-none text-sm placeholder:text-itta-gray3 bg-transparent',
          className,
        )}
        {...props}
      />
    );
  },
);

InputField.displayName = 'InputField';

function InputRight({ children, className }: InputSubComponentProps) {
  return (
    <div className={cn('flex items-center shrink-0', className)}>
      {children}
    </div>
  );
}

export const Input = Object.assign(InputRoot, {
  Left: InputLeft,
  Field: InputField,
  Right: InputRight,
});

export default Input;
