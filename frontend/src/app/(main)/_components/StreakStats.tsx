'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { userRecordPatternOptions } from '@/lib/api/profile';

export default function StreakStats() {
  const { data: streakData } = useSuspenseQuery(userRecordPatternOptions());

  return (
    <div className="border-t-[0.5px] border-gray-100 dark:border-gray-800 flex w-full p-2 sm:p-3 transition-colors duration-300 bg-transparent">
      <div className="flex w-full justify-between gap-1.5 sm:gap-3 items-center border-r px-2 sm:px-3 pr-3 sm:pr-5">
        <span className="text-[11px] sm:text-[12px] whitespace-nowrap">
          오늘 작성
        </span>
        <div className="flex justify-start items-center gap-1 sm:gap-1.5">
          <span className="text-itta-point font-semibold text-sm sm:text-base">
            {streakData.streak}
          </span>
          <span className="text-[11px] sm:text-[12px] font-medium text-gray-400 whitespace-nowrap">
            일째 작성 중
          </span>
        </div>
      </div>
      <div className="flex w-full justify-between gap-1.5 sm:gap-3 items-center px-2 sm:px-3 pl-3 sm:pl-5">
        <span className="text-[11px] sm:text-[12px] whitespace-nowrap">
          이번달 기록
        </span>
        <div className="flex justify-start items-center gap-1 sm:gap-1.5">
          <span className="text-itta-point font-semibold text-sm sm:text-base">
            {streakData.monthlyRecordingDays}
          </span>
          <span className="text-[11px] sm:text-[12px] font-medium text-gray-400 whitespace-nowrap">
            일
          </span>
        </div>
      </div>
    </div>
  );
}
