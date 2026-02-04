'use client';

import { userProfileOptions } from '@/lib/api/profile';
import { cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function PlaceDashboard() {
  const { data: profile, isLoading, isError } = useQuery(userProfileOptions());

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-[13px] font-bold dark:text-white text-itta-black">
            방문 장소 통계
          </h2>
        </div>
        <div className="h-44 w-full pb-3 flex items-center justify-center">
          <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-[13px] font-bold dark:text-white text-itta-black">
            방문 장소 통계
          </h2>
        </div>
        <div className="h-44 w-full pb-3 flex items-center justify-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            데이터를 불러올 수 없습니다.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-[13px] font-bold dark:text-white text-itta-black">
          방문 장소 통계
        </h2>
      </div>

      <div className="py-3">
        {profile?.stats.frequentLocations.length ? (
          <div className="space-y-2">
            {profile?.stats.frequentLocations.map((location, idx) => (
              <div
                key={location.placeName}
                className="flex items-center justify-between"
              >
                <span className="flex justify-center items-start gap-2.5 text-[14px] font-medium dark:text-gray-300 text-[#555555]">
                  <span
                    className={cn(
                      'text-[14px] font-semibold',
                      idx > 0 ? 'text-gray-500/60' : 'text-itta-point',
                    )}
                  >
                    {idx + 1}
                  </span>
                  {location.placeName}
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-[16px] font-semibold dark:text-white text-[#222222]">
                    {location.count}
                  </span>
                  <span className="text-[12px] font-medium text-gray-400">
                    개
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-full flex items-center justify-center dark:bg-[#10B981]/10 bg-[#10B981]/10">
              <MapPin className="w-5 h-5 text-[#10B981]" />
            </div>
            <div className="space-y-1 text-center">
              <p className="text-sm font-bold dark:text-gray-200 text-gray-700">
                아직 방문한 장소가 없어요
              </p>
              <p className="text-xs text-gray-400">
                장소를 추가하여 기록해보세요
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
