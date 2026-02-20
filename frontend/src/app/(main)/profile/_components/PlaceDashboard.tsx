'use client';

import { userProfileOptions } from '@/lib/api/profile';
import { cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';

const PlaceDashboard = memo(function PlaceDashboard() {
  const { data: profile, isLoading, isError } = useQuery(userProfileOptions());

  if (isLoading) {
    return (
      <section className="space-y-3 sm:space-y-4">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <h2 className="text-xs sm:text-[13px] font-bold dark:text-white text-itta-black">
            방문 장소 통계
          </h2>
        </div>
        <div className="h-36 sm:h-44 w-full pb-3 flex items-center justify-center">
          <div className="w-full h-24 sm:h-32 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="space-y-3 sm:space-y-4">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <h2 className="text-xs sm:text-[13px] font-bold dark:text-white text-itta-black">
            방문 장소 통계
          </h2>
        </div>
        <div className="h-36 sm:h-44 w-full pb-3 flex items-center justify-center">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            데이터를 불러올 수 없습니다.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3 sm:space-y-4">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <h2 className="text-xs sm:text-[13px] font-bold dark:text-white text-itta-black">
          방문 장소 통계
        </h2>
      </div>

      <div className="py-2 sm:py-3">
        {profile?.stats.frequentLocations.length ? (
          <div className="space-y-1.5 sm:space-y-2">
            {profile?.stats.frequentLocations.map((location, idx) => (
              <div
                key={location.placeName}
                className="flex items-center justify-between"
              >
                <span className="flex justify-start items-center gap-2 sm:gap-2.5 text-xs sm:text-sm font-medium dark:text-gray-300 text-[#555555]">
                  <span
                    className={cn(
                      'font-semibold',
                      idx > 0 ? 'text-gray-500/60' : 'text-itta-point',
                    )}
                  >
                    {idx + 1}
                  </span>
                  {location.placeName}
                </span>
                <div className="flex items-baseline gap-0.5 sm:gap-1">
                  <span className="text-sm sm:text-[16px] font-semibold dark:text-white text-[#222222]">
                    {location.count}
                  </span>
                  <span className="text-[11px] sm:text-[12px] font-medium text-gray-400">
                    개
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 sm:py-8 flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center dark:bg-[#10B981]/10 bg-[#10B981]/10">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#10B981]" />
            </div>
            <div className="space-y-1 text-center">
              <p className="text-xs sm:text-sm font-bold dark:text-gray-200 text-gray-700">
                아직 방문한 장소가 없어요
              </p>
              <p className="text-[11px] sm:text-xs text-gray-400">
                장소를 추가하여 기록해보세요
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
});

export default PlaceDashboard;
