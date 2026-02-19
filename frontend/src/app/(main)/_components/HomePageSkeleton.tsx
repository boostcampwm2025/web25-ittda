function StreakStatsSkeleton() {
  return (
    <div className="border-t-[0.5px] border-gray-100 dark:border-gray-800 flex w-full p-2 py-3 sm:p-3 sm:py-4 animate-pulse">
      <div className="flex w-full justify-between gap-1.5 sm:gap-3 items-center border-r px-2 sm:px-3 pr-3 sm:pr-5">
        <div className="h-3.5 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="flex items-center gap-1 sm:gap-1.5">
          <div className="h-5 sm:h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3.5 w-14 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
      <div className="flex w-full justify-between gap-1.5 sm:gap-3 items-center px-2 sm:px-3 pl-3 sm:pl-5">
        <div className="h-3.5 w-14 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="flex items-center gap-1 sm:gap-1.5">
          <div className="h-5 sm:h-6 w-5 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3.5 w-4 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    </div>
  );
}

function RecordItemSkeleton() {
  return (
    <div className="rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border dark:bg-[#1E1E1E] dark:border-white/5 bg-white border-gray-100 animate-pulse">
      <div className="flex items-center justify-between mb-3 sm:mb-4 mt-1">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="h-4.5 sm:h-6 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4.5 w-10 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
      <div className="space-y-2 sm:space-y-3">
        <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-3 w-4/5 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="w-full aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    </div>
  );
}

export default function HomePageSkeleton() {
  return (
    <>
      <StreakStatsSkeleton />
      <div className="flex-1 w-full overflow-y-auto scrollbar-hide px-5 space-y-6 pt-7 pb-bottom-nav transition-colors duration-300 dark:bg-[#121212] bg-[#F9F9F9]">
        <div className="w-full flex flex-col gap-6">
          <div className="flex flex-col space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between px-0.5 sm:px-1 animate-pulse">
              <div className="h-3.5 sm:h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 w-10 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <RecordItemSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
