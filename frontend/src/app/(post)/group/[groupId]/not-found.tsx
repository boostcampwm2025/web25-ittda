'use client';

import Link from 'next/link';

export default function GroupNotFound() {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#FDFDFD] dark:bg-[#121212]">
      <div className="text-center space-y-6 p-8">
        <div className="text-6xl">👥</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          그룹을 찾을 수 없습니다
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          요청하신 그룹이 존재하지 않거나 삭제되었습니다.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link
            href="/"
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            홈으로 가기
          </Link>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            이전 페이지
          </button>
        </div>
      </div>
    </div>
  );
}