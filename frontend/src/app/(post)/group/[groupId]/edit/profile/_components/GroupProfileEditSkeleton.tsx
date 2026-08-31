export default function GroupProfileEditSkeleton() {
  return (
    <div className="w-full flex flex-col min-h-screen dark:bg-[#121212] dark:text-white bg-white text-itta-black animate-pulse">
      {/* 헤더 - ProfileEditHeaderActions와 동일한 패딩 */}
      <div className="sticky top-0 z-50 px-4 py-3 sm:p-6 flex items-center justify-between bg-white/95 dark:bg-[#121212]/95">
        <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-3.5 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-3.5 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>

      {/* 컨텐츠 - p-6 flex flex-col gap-10 */}
      <div className="flex p-6 flex-col gap-10">
        {/* ProfileInfo의 py-8 flex flex-col gap-10 */}
        <div className="py-8 flex flex-col gap-10">
          {/* 프로필 이미지 */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 bg-gray-200 dark:bg-gray-700 border-gray-50 dark:border-[#1E1E1E]" />
              <div className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-white" />
            </div>
          </div>

          {/* 닉네임만 (이메일 없음) */}
          <div className="w-full space-y-8 mt-2">
            <div className="space-y-2">
              <div className="h-2.5 w-10 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="border-b-2 border-gray-100 dark:border-white/5 py-4">
                <div className="h-5.5 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
              <div className="h-2.5 w-48 bg-gray-100 dark:bg-gray-800 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
