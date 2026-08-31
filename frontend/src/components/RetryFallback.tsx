'use client';

import Back from '@/components/Back';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RetryFallbackProps {
  /** Back 버튼의 fallback 경로. 미전달 시 Back 버튼 미노출. */
  fallback?: string;
  className?: string;
}

export default function RetryFallback({
  fallback,
  className,
}: RetryFallbackProps) {
  const router = useRouter();

  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      {fallback !== undefined && <Back fallback={fallback} />}
      <button
        onClick={() => router.refresh()}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        재시도
      </button>
    </div>
  );
}
