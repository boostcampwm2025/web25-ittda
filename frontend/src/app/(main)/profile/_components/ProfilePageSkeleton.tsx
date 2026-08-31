function ProfileCardSkeleton() {
  return (
    <div className="rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xs border flex items-center gap-3 sm:gap-5 transition-colors duration-300 dark:bg-[#1E1E1E] dark:border-white/5 bg-white border-gray-100 animate-pulse">
      <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-gray-200 dark:bg-gray-700" />
      <div className="flex-1">
        <div className="h-5 w-20 sm:w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
        <div className="h-4 w-24 sm:w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2.5 sm:mb-3" />
        <div className="h-5.5 sm:h-7 w-16 sm:w-20 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
  );
}

function TagDashboardSkeleton() {
  return (
    <div className="rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xs border transition-colors duration-300 dark:bg-[#1E1E1E] dark:border-white/5 bg-white border-gray-100 animate-pulse">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-7 w-28 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-7 rounded-lg bg-gray-200 dark:bg-gray-700"
            style={{ width: `${60 + i * 10}px` }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 border-t pt-3 sm:pt-5 dark:border-white/5 border-gray-50">
        <div className="flex-1 h-9 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        <div className="w-px h-3 sm:h-4 dark:bg-white/5 bg-gray-100" />
        <div className="flex-1 h-7 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
  );
}

function RecordStatisticsSkeleton() {
  return (
    <div className="rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xs border transition-colors duration-300 dark:bg-[#1E1E1E] dark:border-white/5 bg-white border-gray-200/60 animate-pulse">
      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
      <div className="space-y-2">
        <div className="flex justify-between">
          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-10 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="flex justify-between">
          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-10 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function ProfilePageSkeleton() {
  return (
    <>
      <ProfileCardSkeleton />
      <TagDashboardSkeleton />
      <RecordStatisticsSkeleton />
    </>
  );
}
