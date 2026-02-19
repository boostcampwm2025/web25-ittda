import MonthlyDetailRecordsSkeleton from '@/app/(post)/_components/MonthlyDetailRecordsSkeleton';

export default function Loading() {
  return (
    <div className="h-full transition-colors duration-300 dark:bg-[#121212] bg-[#FDFDFD]">
      <div className="py-3 px-4 sm:py-6 sm:px-6 sticky top-0 z-50 transition-colors duration-300 dark:bg-[#121212] bg-white">
        <div className="flex items-center justify-between">
          <div className="h-4 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
      <div className="p-4 sm:p-6 pb-28 sm:pb-40">
        <MonthlyDetailRecordsSkeleton />
      </div>
    </div>
  );
}
