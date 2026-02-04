export function ActivityItemSkeleton() {
  return (
    <div className="flex gap-3 px-4 py-4 animate-pulse">
      {/* 프로필 이미지 스켈레톤 */}
      <div className="shrink-0 relative">
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
        {/* 뱃지 스켈레톤 */}
        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600" />
      </div>

      {/* 메시지 스켈레톤 */}
      <div className="flex-1 min-w-0 space-y-2.5 pt-0.5">
        <div className="h-3.75 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
      </div>
    </div>
  );
}
