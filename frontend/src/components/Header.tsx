import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface HeaderProps {
  title: string;
  rightContent?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export default function Header({
  title,
  rightContent,
  className,
  children,
}: HeaderProps) {
  return (
    <header
      className={cn(
        'relative z-20 w-full px-6 py-8 pb-5.5 bg-white shadow-[0_4px_6px_-4px_rgba(0,0,0,0.15)]',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-itta-black">{title}</h1>

        <div className="flex items-center space-x-2">{rightContent}</div>
      </div>
      {children}
    </header>
  );
}
