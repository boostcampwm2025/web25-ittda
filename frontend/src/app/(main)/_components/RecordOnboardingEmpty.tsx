'use client';

import { useRouter } from 'next/navigation';
import { BookOpen, Plus } from 'lucide-react';

interface RecordOnboardingEmptyProps {
  groupId?: string;
}

export default function RecordOnboardingEmpty({
  groupId,
}: RecordOnboardingEmptyProps) {
  const router = useRouter();

  return (
    <div className="py-12 sm:py-16 flex flex-col items-center justify-center text-center space-y-3 sm:space-y-4 rounded-xl sm:rounded-2xl border border-dashed dark:bg-white/5 dark:border-white/10 bg-white border-gray-200">
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center dark:bg-[#10B981]/10 bg-[#10B981]/10">
        <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-[#10B981]" />
      </div>
      <div className="space-y-1">
        <p className="text-xs sm:text-sm font-bold dark:text-gray-200 text-gray-700">
          아직 쌓인 기록이 없어요
        </p>
        <p className="text-[11px] sm:text-xs text-gray-400 text-balance max-w-56 mx-auto">
          {groupId
            ? '이 그룹의 첫 기록을 남겨보세요'
            : '나의 첫 기록을 남겨보세요'}
        </p>
      </div>
      {!groupId && (
        <button
          type="button"
          onClick={() => router.push('/add')}
          className="mt-2 flex items-center gap-1 sm:gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-bold text-white bg-itta-black shadow-lg shadow-itta-black/20 hover:bg-itta-black/80 active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />첫 기록 남기기
        </button>
      )}
    </div>
  );
}
