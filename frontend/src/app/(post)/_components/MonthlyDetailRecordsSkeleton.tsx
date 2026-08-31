function DateRecordCardSkeleton() {
  return (
    <div className="aspect-square rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse relative overflow-hidden">
      {/* 좌상단 날짜 뱃지 */}
      <div className="absolute top-3 left-3 w-9 h-10 rounded-xl bg-gray-300 dark:bg-gray-700" />
      {/* 하단 오버레이 */}
      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 space-y-1.5">
        <div className="h-3 w-3/4 bg-gray-300 dark:bg-gray-700 rounded" />
        <div className="flex items-center justify-between">
          <div className="h-2.5 w-1/3 bg-gray-300 dark:bg-gray-700 rounded" />
          <div className="h-4 w-7 bg-gray-300 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function MonthlyDetailRecordsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 xs:grid-cols-3 md:grid-cols-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <DateRecordCardSkeleton key={i} />
      ))}
    </div>
  );
}
