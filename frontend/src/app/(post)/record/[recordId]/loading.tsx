function RecordDetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 제목 영역 */}
      <div className="space-y-2">
        <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>

      {/* 콘텐츠 블록들 */}
      <div className="space-y-4">
        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-4/6 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="aspect-video w-full bg-gray-200 dark:bg-gray-700 rounded-xl" />
        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
  );
}

export default function Loading() {
  return <RecordDetailSkeleton />;
}
