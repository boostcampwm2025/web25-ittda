'use client';

import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BackProps {
  size?: number;
  className?: string;
  onClick?: VoidFunction;
  fallback?: string;
}

export default function Back({ size, className, onClick, fallback }: BackProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length <= 1 && fallback) {
      router.replace(fallback);
    } else {
      router.back();
    }
    onClick?.();
  };

  return (
    <button
      onClick={handleBack}
      className={cn('cursor-pointer active:scale-80 transition-all', className)}
    >
      <ArrowLeft className="dark:text-white text-itta-black" size={size} />
    </button>
  );
}
