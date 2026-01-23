'use client';

import { useRouter } from 'next/navigation';
import MonthlyPatternChart from '../../_components/MonthlyPatternChart';
import { cn } from '@/lib/utils';
import { useApiQuery } from '@/hooks/useApi';
import { EmotionStatSummary } from '@/lib/types/profile';
import { EMOTION_MAP } from '@/lib/constants/constants';

export default function EmotionDashboard() {
  const router = useRouter();

  const {
    data: currentEmotions,
    isLoading,
    isError,
  } = useApiQuery<EmotionStatSummary>(
    ['emotion', 'summary'],
    '/api/me/emotions/summary?limit=7',
  );

  if (isLoading) {
    return (
      <section className="space-y-4 animate-pulse">
        <div className="h-20 w-full bg-gray-200 dark:bg-gray-700 rounded mb-4" />
        <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded" />
      </section>
    );
  }

  if (isError || !currentEmotions) {
    return (
      <section className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          감정 데이터를 불러올 수 없습니다.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-[13px] font-bold dark:text-white text-itta-black">
          자주 사용된 감정
        </h2>
      </div>

      <div className="w-full justify-between items-center">
        <MonthlyPatternChart />

        {/* 리스트 형태로 감정 데이터 표시 */}
        <div className="mt-5 mb-6">
          {currentEmotions.length > 0 ? (
            <div className="space-y-2">
              {[...currentEmotions]
                .sort((a, b) => b.count - a.count)
                .slice(0, 5)
                .map((emotion, index) => {
                  const totalCount = currentEmotions.reduce(
                    (sum, e) => sum + e.count,
                    0,
                  );
                  const percentage = (
                    (emotion.count / totalCount) *
                    100
                  ).toFixed(1);

                  return (
                    <div
                      key={emotion.emotion}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg dark:bg-white/5 bg-white transition-colors"
                    >
                      {/* 순위 */}
                      <span
                        className={cn(
                          'text-[13px] font-semobold text-itta-point w-5 text-center',
                          index > 0 && 'text-gray-400',
                        )}
                      >
                        {index + 1}
                      </span>

                      {/* 이모지 */}
                      <span className="text-lg">
                        {EMOTION_MAP[emotion.emotion]}
                      </span>

                      {/* 감정명 */}
                      <span className="text-[13px] font-medium dark:text-gray-200 text-itta-black flex-1">
                        {emotion.emotion}
                      </span>

                      {/* 횟수 */}
                      <span className="text-[12px] font-bold text-[#10B981]/90">
                        {emotion.count}회
                      </span>

                      {/* 퍼센티지 */}
                      <span className="text-[11px] font-medium text-gray-400 w-12 text-right">
                        {percentage}%
                      </span>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="w-full text-center py-4 text-[11px] text-gray-400">
              사용된 감정이 없습니다.
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 border-t pt-5 dark:border-white/5 border-gray-50">
        <button
          onClick={() => router.push('/profile/all-emotions')}
          className="cursor-pointer flex-1 py-3 text-xs font-bold text-gray-400 active:scale-95 transition-all hover:text-gray-500"
        >
          모두 보기
        </button>
      </div>
    </section>
  );
}
