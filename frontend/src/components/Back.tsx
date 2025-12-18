'use client';

import { cn } from '@/lib/utils';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BackProps {
  size?: number;
  className?: number;
}

export default function Back({ size, className }: BackProps) {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <button onClick={handleBack} className={cn('', className)}>
      <ChevronLeft color="var(--itta-black)" size={size} />
    </button>
  );
}
