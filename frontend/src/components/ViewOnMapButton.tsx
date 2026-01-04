'use client';

import { MapIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ViewOnMapButtonProps {
  routePath: string;
}

export default function ViewOnMapButton({ routePath }: ViewOnMapButtonProps) {
  const router = useRouter();

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4 duration-500">
      <button
        onClick={() => router.push(routePath)}
        className="cursor-pointer flex items-center gap-2.5 px-6 py-3.5 rounded-full shadow-2xl backdrop-blur-xl border transition-all active:scale-95 dark:bg-[#1E1E1E]/90 dark:border-white/10 dark:text-white bg-white/90 border-gray-100 text-itta-black"
      >
        <MapIcon className="w-4 h-4 text-[#10B981]" strokeWidth={2.5} />
        <span className="text-xs font-bold tracking-tight">지도로 보기</span>
      </button>
    </div>
  );
}
