import DailyDetailRecordsSkeleton from '@/components/DailyDetailRecordsSkeleton';
import Back from '@/components/Back';

export default function Loading() {
  return (
    <div className="h-full transition-colors duration-300 dark:bg-[#121212] bg-[#FDFDFD]">
      <header className="sticky top-0 z-50 backdrop-blur-md px-4 py-3 sm:p-6 flex items-center justify-between transition-colors duration-300 dark:bg-[#121212]/80 bg-white/80">
        <Back />
        <div className="flex flex-col items-center gap-1">
          <div className="h-2.5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="w-6 sm:w-8" />
      </header>
      <div className="p-4 sm:p-6">
        <DailyDetailRecordsSkeleton />
      </div>
    </div>
  );
}
