'use client';

import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BackProps {
  size?: number;
  className?: number;
  onClick?: VoidFunction;
}

export default function Back({ size, className, onClick }: BackProps) {
  const router = useRouter();

  const handleBack = () => {
    router.back();
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
