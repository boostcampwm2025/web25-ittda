function DailyDetailRecordItemSkeleton() {
  return (
    <div className="space-y-2">
      {/* 시간 & 액션 행 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="h-3 w-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        </div>
        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
      </div>

      {/* 메인 카드 */}
      <div className="rounded-lg p-5 border dark:bg-[#1E1E1E] dark:border-white/5 bg-white border-gray-100/60">
        {/* 제목 & 아바타 행 */}
        <div className="flex justify-between items-start gap-2 mb-4">
          <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse shrink-0" />
        </div>

        {/* 블록 콘텐츠 */}
        <div className="space-y-3">
          <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-3 w-5/6 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="aspect-video w-full bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function DailyDetailRecordsSkeleton() {
  return (
    <div className="relative border-l-[1.5px] space-y-6 dark:border-white/10 border-gray-100">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="relative pl-6">
          <div className="absolute -left-[7.5px] top-1 w-3.5 h-3.5 rounded-full z-10 border-2 shadow-sm dark:bg-gray-800 dark:border-[#121212] bg-gray-200 border-white animate-pulse" />
          <DailyDetailRecordItemSkeleton />
        </div>
      ))}
    </div>
  );
}
