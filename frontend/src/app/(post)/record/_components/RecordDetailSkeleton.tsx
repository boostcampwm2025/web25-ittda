export default function RecordDetailSkeleton() {
  return (
    <div className="-mt-6 h-full transition-colors duration-300 dark:bg-[#121212] bg-[#FDFDFD]">
      <header className="-mx-6 sticky top-0 z-50 backdrop-blur-md p-6 flex items-center justify-between transition-colors duration-300 dark:bg-[#121212]/90 bg-white/90">
        {/* Back button */}
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
        {/* More button */}
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
      </header>

      <main className="max-w-3xl mx-auto">
        {/* Title */}
        <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-800 rounded-lg mb-6 animate-pulse" />

        <div className="space-y-3">
          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
            <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          </div>

          {/* Text block */}
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-lg w-5/6 animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-lg w-4/6 animate-pulse" />
          </div>

          {/* Tags and Rating */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex gap-1.5">
              <div className="h-7 w-16 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
              <div className="h-7 w-20 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
              <div className="h-7 w-14 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
            </div>
            <div className="flex justify-end">
              <div className="h-6 w-20 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
            </div>
          </div>

          {/* Image */}
          <div className="w-full aspect-square bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
        </div>

        {/* Contributors */}
        <div className="pt-8 mt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="h-4 w-16 bg-gray-200 dark:bg-gray-800 rounded mb-3 animate-pulse" />
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
        </div>
      </main>
    </div>
  );
}
