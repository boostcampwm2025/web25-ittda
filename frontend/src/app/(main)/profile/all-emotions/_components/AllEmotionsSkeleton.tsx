export default function AllEmotionsSkeleton() {
  return (
    <div className="p-4 sm:p-5 animate-pulse">
      {/* 요약 카드 */}
      <div className="rounded-xl p-4 sm:p-6 dark:bg-white/5 bg-gray-50">
        <div className="h-[14px] w-28 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
        <div className="h-[14px] w-40 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>

      {/* 탭 바 */}
      <div className="flex border-b dark:border-white/5 border-gray-50 mt-4 sm:mt-5">
        <div className="flex-1 py-3 sm:py-4 flex justify-center">
          <div className="h-[14px] w-16 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="flex-1 py-3 sm:py-4 flex justify-center">
          <div className="h-[14px] w-16 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>

      {/* 리스트 아이템 */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-5"
        >
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-[14px] w-16 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
          <div className="h-[14px] w-6 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      ))}
    </div>
  );
}
