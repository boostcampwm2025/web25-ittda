'use client';

import { RefreshCw } from 'lucide-react';
import { FallbackProps } from './ErrorBoundary';

export default function ErrorFallback({
  error,
  resetErrorBoundary,
}: FallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="space-y-2 mb-8">
        <h3 className="text-md font-bold tracking-tight dark:text-white text-[#222222]">
          잠시 후 다시 시도해주세요.
        </h3>
        <p className="text-xs font-medium dark:text-gray-500 text-gray-400">
          요청사항을 처리하는데
          <br />
          실패했습니다.
        </p>
      </div>

      <button
        onClick={resetErrorBoundary}
        className="cursor-pointer px-8 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-95 dark:bg-white/10 dark:text-white dark:hover:bg-white/15 bg-itta-black text-white hover:bg-gray-200"
      >
        <RefreshCw className="w-4 h-4" />
        다시 시도
      </button>
    </div>
  );
}
