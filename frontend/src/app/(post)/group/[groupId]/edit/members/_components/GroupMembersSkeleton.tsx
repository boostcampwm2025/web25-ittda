export default function GroupMembersSkeleton() {
  return (
    <div className="animate-pulse">
      <header className="sticky top-0 z-50 px-4 py-3 sm:p-6 flex items-center justify-between bg-white/95 dark:bg-[#121212]/95">
        <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-3.5 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-3.5 w-4" />
      </header>

      <div className="px-6 pb-10 pt-6 space-y-4">
        <div className="h-3.5 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 rounded-2xl border dark:bg-white/5 dark:border-white/5 bg-gray-50 border-black/2"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-2.75 w-12 bg-gray-100 dark:bg-gray-800 rounded" />
              </div>
            </div>
            <div className="h-6 w-12 bg-gray-100 dark:bg-gray-800 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
