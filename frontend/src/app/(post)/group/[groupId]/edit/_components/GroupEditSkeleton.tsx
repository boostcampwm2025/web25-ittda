export default function GroupEditSkeleton() {
  return (
    <div className="animate-pulse">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 px-4 py-3 sm:p-6 flex items-center justify-between bg-white/95 dark:bg-[#121212]/95">
        <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-3.5 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-3.5 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
      </header>

      {/* 컨텐츠 */}
      <div className="px-6 pb-10 pt-15 space-y-10">
        {/* GroupInfo */}
        <section className="space-y-4">
          {/* 그룹 썸네일 */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-[32px] bg-gray-200 dark:bg-gray-700 border-4 border-white dark:border-[#121212]" />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-gray-300 dark:bg-gray-600 border-2 border-white" />
            </div>
          </div>

          {/* 그룹 이름 */}
          <div className="space-y-2">
            <div className="h-2.5 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="border-b-2 border-gray-100 dark:border-white/5 py-4">
              <div className="h-5 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>

          {/* 나의 그룹 프로필 */}
          <section className="space-y-4">
            <div className="h-2.5 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="w-full flex items-center justify-between px-3 py-4 sm:p-4 rounded-3xl border dark:bg-[#10B981]/5 dark:border-[#10B981]/10 bg-[#10B981]/5 border-[#10B981]/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-2.75 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
              <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </section>
        </section>

        {/* GroupMemberManagement */}
        <section className="space-y-4">
          <div className="h-3.5 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
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
        </section>

        {/* GroupDangerousZone */}
        <section className="space-y-4">
          <div className="h-3.5 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-12 w-full bg-gray-100 dark:bg-gray-800 rounded-2xl" />
        </section>
      </div>
    </div>
  );
}
