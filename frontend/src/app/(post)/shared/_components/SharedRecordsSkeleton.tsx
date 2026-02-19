function RecordCardSkeleton() {
  return (
    <div className="h-42 sm:h-50 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse relative overflow-hidden">
      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="h-3 w-2/3 bg-gray-300 dark:bg-gray-700 rounded" />
          <div className="h-4 w-7 bg-gray-300 dark:bg-gray-700 rounded-lg" />
        </div>
        <div className="h-2.5 w-4/5 bg-gray-300 dark:bg-gray-700 rounded" />
        <div className="h-2 w-1/3 bg-gray-300 dark:bg-gray-700 rounded" />
      </div>
    </div>
  );
}

export default function SharedRecordsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <RecordCardSkeleton key={i} />
      ))}
    </div>
  );
}
