import { cn } from '@/lib/utils';

export default function PlaceDashboard() {
  const topPlaces = [
    { name: '코드스쿼드', count: 15 },
    { name: '알바 카페', count: 9 },
    { name: '우리집', count: 5 },
    { name: '학교', count: 2 },
    { name: '스타벅스', count: 1 },
  ];

  return (
    <section className="space-y-5 rounded-2xl p-6 shadow-xs border transition-colors duration-300 dark:bg-[#1E1E1E] dark:border-white/5 bg-white border-gray-200/60">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-[13px] font-bold dark:text-white text-itta-black">
          방문 장소 통계
        </h2>
      </div>

      <div className="py-3">
        <div className="space-y-2">
          {topPlaces.map((place, idx) => (
            <div key={place.name} className="flex items-center justify-between">
              <span className="flex justify-center items-start gap-2.5 text-[14px] font-medium dark:text-gray-300 text-[#555555]">
                <span
                  className={cn(
                    'text-[14px] font-semibold',
                    idx > 0 ? 'text-gray-500/60' : 'text-itta-point',
                  )}
                >
                  {idx + 1}
                </span>
                {place.name}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-[16px] font-semibold dark:text-white text-[#222222]">
                  {place.count}
                </span>
                <span className="text-[12px] font-medium text-gray-400">
                  개
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
