'use client';

import { userProfileOptions } from '@/lib/api/profile';
import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';

const WritingRecordStatistics = memo(function WritingRecordStatistics() {
  const { data: profile } = useQuery(userProfileOptions());

  return (
    <>
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <h2 className="text-xs sm:text-[13px] font-bold dark:text-white text-itta-black">
          작성 기록 통계
        </h2>
      </div>

      <div className="py-2 sm:py-3">
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium dark:text-gray-300 text-[#555555]">
              작성한 기록
            </span>
            <div className="flex items-baseline gap-0.5 sm:gap-1">
              <span className="text-sm sm:text-[16px] font-semibold dark:text-white text-[#222222]">
                {profile?.stats.totalPosts}
              </span>
              <span className="text-[11px] sm:text-xs font-medium text-gray-400">
                개
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium dark:text-gray-300 text-[#555555]">
              추가한 이미지
            </span>
            <div className="flex items-baseline gap-0.5 sm:gap-1">
              <span className="text-sm sm:text-base font-semibold dark:text-white text-[#222222]">
                {profile?.stats.totalImages}
              </span>
              <span className="text-[11px] sm:text-xs font-medium text-gray-400">
                개
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

export default WritingRecordStatistics;
