import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface HeaderRootProps {
  className?: string;
  children: ReactNode;
}

interface HeaderSubComponentProps {
  children: ReactNode;
  className?: string;
}

function HeaderRoot({ className, children }: HeaderRootProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-20 w-full px-6 py-8 pb-5.5 bg-white shadow-[0_4px_6px_-4px_rgba(0,0,0,0.15)]',
        className,
      )}
    >
      <div className="flex items-center gap-4">{children}</div>
    </header>
  );
}

function HeaderLeft({ children, className }: HeaderSubComponentProps) {
  return (
    <div className={cn('flex items-center space-x-2 shrink-0', className)}>
      {children}
    </div>
  );
}

function HeaderTitle({ children, className }: HeaderSubComponentProps) {
  return (
    <h1
      className={cn('text-2xl font-bold text-itta-black shrink-0', className)}
    >
      {children}
    </h1>
  );
}

function HeaderCenter({ children, className }: HeaderSubComponentProps) {
  return (
    <div className={cn('flex-1 flex justify-center', className)}>
      {children}
    </div>
  );
}

function HeaderRight({ children, className }: HeaderSubComponentProps) {
  return (
    <div className={cn('flex items-center space-x-2 shrink-0', className)}>
      {children}
    </div>
  );
}

export const Header = Object.assign(HeaderRoot, {
  Left: HeaderLeft,
  Title: HeaderTitle,
  Center: HeaderCenter,
  Right: HeaderRight,
});

export default Header;
