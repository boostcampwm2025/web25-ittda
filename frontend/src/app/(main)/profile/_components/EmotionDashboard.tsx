'use client';

import { useRouter } from 'next/navigation';
import MonthlyPatternChart from '../../_components/MonthlyPatternChart';
import { cn } from '@/lib/utils';
import { Smile } from 'lucide-react';
import { EMOTION_MAP } from '@/lib/constants/constants';
import { useQuery } from '@tanstack/react-query';
import { userProfileEmotionSummaryOptions } from '@/lib/api/profile';

export default function EmotionDashboard() {
  const router = useRouter();

  const {
    data: currentEmotions = { emotion: [], totalCount: 0 },
    isLoading,
    isError,
  } = useQuery(userProfileEmotionSummaryOptions(10));

  if (isLoading) {
    return (
      <section className="space-y-3 sm:space-y-4 animate-pulse">
        <div className="h-16 sm:h-20 w-full bg-gray-200 dark:bg-gray-700 rounded mb-3 sm:mb-4" />
        <div className="h-32 sm:h-40 bg-gray-200 dark:bg-gray-700 rounded" />
      </section>
    );
  }

  if (isError || !currentEmotions) {
    return (
      <section className="space-y-3 sm:space-y-4">
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          감정 데이터를 불러올 수 없습니다.
        </p>
      </section>
    );
  }

  // 데이터가 전혀 없는 경우
  if (currentEmotions.totalCount === 0 || currentEmotions.emotion.length === 0) {
    return (
      <section className="space-y-3 sm:space-y-4">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <h2 className="text-xs sm:text-[13px] font-bold dark:text-white text-itta-black">
            자주 사용된 감정
          </h2>
        </div>
        <div className="py-8 sm:py-12 flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center dark:bg-[#10B981]/10 bg-[#10B981]/10">
            <Smile className="w-4 h-4 sm:w-5 sm:h-5 text-[#10B981]" />
          </div>
          <div className="space-y-1 text-center">
            <p className="text-xs sm:text-sm font-bold dark:text-gray-200 text-gray-700">
              아직 기록한 감정이 없어요
            </p>
            <p className="text-[11px] sm:text-xs text-gray-400">
              오늘의 기분을 기록해보세요
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3 sm:space-y-4">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <h2 className="text-xs sm:text-[13px] font-bold dark:text-white text-itta-black">
          자주 사용된 감정
        </h2>
      </div>

      <div className="w-full justify-between items-center">
        <MonthlyPatternChart emotions={currentEmotions} />
        <div className="flex items-center justify-end pr-1 gap-1 text-itta-black/80 dark:text-gray-300">
          <p className="text-[10px] sm:text-[11px] tracking-tight">
            총&nbsp;
            <span className="font-bold text-[#10B981]/90">
              {currentEmotions.totalCount}개
            </span>
            &nbsp;중
          </p>
        </div>
        {/* 리스트 형태로 감정 데이터 표시 */}
        <div className="mt-4 sm:mt-5 mb-5 sm:mb-6">
          <div className="space-y-1.5 sm:space-y-2">
            {[...currentEmotions.emotion]
              .sort((a, b) => b.count - a.count)
              .slice(0, 5)
              .map((emotion, index) => {
                const totalCount = currentEmotions.totalCount;
                const percentage = (
                  (emotion.count / totalCount) *
                  100
                ).toFixed(1);

                return (
                  <div
                    key={emotion.emotion}
                    className="flex items-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-3 rounded-lg dark:bg-white/5 bg-white transition-colors"
                  >
                    {/* 순위 */}
                    <span
                      className={cn(
                        'text-xs sm:text-[13px] font-semobold text-itta-point w-4 sm:w-5 text-center',
                        index > 0 && 'text-gray-400',
                      )}
                    >
                      {index + 1}
                    </span>

                    {/* 이모지 */}
                    <span className="text-base sm:text-lg">
                      {EMOTION_MAP[emotion.emotion]}
                    </span>

                    {/* 감정명 */}
                    <span className="text-xs sm:text-[13px] font-medium dark:text-gray-200 text-itta-black flex-1">
                      {emotion.emotion}
                    </span>

                    {/* 횟수 */}
                    <span className="text-[11px] sm:text-[12px] font-bold text-[#10B981]/90">
                      {emotion.count}회
                    </span>

                    {/* 퍼센티지 */}
                    <span className="text-[10px] sm:text-[11px] font-medium text-gray-400 w-10 sm:w-12 text-right">
                      {percentage}%
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t pt-3 sm:pt-5 dark:border-white/5 border-gray-50">
        <button
          onClick={() => router.push('/profile/all-emotions')}
          className="cursor-pointer flex-1 py-2 sm:py-3 text-[11px] sm:text-xs font-bold text-gray-400 active:scale-95 transition-all hover:text-gray-500"
        >
          모두 보기
        </button>
      </div>
    </section>
  );
}
