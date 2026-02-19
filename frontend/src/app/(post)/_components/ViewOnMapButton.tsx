'use client';

import { cn } from '@/lib/utils';
import { MapIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ViewOnMapButtonProps {
  routePath: string;
  className?: string;
}

export default function ViewOnMapButton({
  routePath,
  className,
}: ViewOnMapButtonProps) {
  const router = useRouter();

  return (
    <div
      className={cn(
        'fixed bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4 duration-500',
        className,
      )}
    >
      <button
        onClick={() => router.push(routePath)}
        className="cursor-pointer flex items-center gap-2 sm:gap-2.5 px-4 py-3 sm:px-6 sm:py-3.5 rounded-full shadow-2xl backdrop-blur-xl border transition-all active:scale-95 dark:bg-[#1E1E1E]/90 dark:border-white/10 dark:text-white bg-white/90 border-gray-100 text-itta-black"
      >
        <MapIcon
          className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#10B981]"
          strokeWidth={2.5}
        />
        <span className="text-[11px] sm:text-xs font-bold tracking-tight">
          지도로 보기
        </span>
      </button>
    </div>
  );
}
