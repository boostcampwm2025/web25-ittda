'use client';

import { FallbackProps } from '@/components/ErrorBoundary';
import ErrorFallback from '@/components/ErrorFallback';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function RecordErrorFallback({
  error,
  resetErrorBoundary,
}: FallbackProps) {
  const router = useRouter();
  const isNotFound = error && 'code' in error && error.code === 'NOT_FOUND';
  // 그룹에 공유됐던 글이 공유 취소되었거나, 애초에 접근 권한이 없던 경우
  // 모두 여기로 들어온다 — 알림/활동 로그를 통해 예전 링크로 들어왔을 때
  // 일반 시스템 에러 화면 대신 이유를 알 수 있는 안내를 보여준다.
  const isForbidden = error && 'code' in error && error.code === 'FORBIDDEN';

  if (isNotFound || isForbidden) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-[#FDFDFD] dark:bg-[#121212]">
        <div className="text-center space-y-6 p-8">
          <div className="text-6xl">{isForbidden ? '🔒' : '📝'}</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {isForbidden
              ? '더 이상 볼 수 없는 기록이에요'
              : '기록을 찾을 수 없습니다'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isForbidden
              ? '공유가 취소되었거나, 접근 권한이 없는 기록이에요.'
              : '요청하신 기록이 존재하지 않거나 삭제되었습니다.'}
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Link
              href="/"
              className="px-6 py-2 bg-itta-point text-white rounded-lg hover:bg-itta-point/60 transition-colors"
            >
              홈으로 가기
            </Link>
            <button
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              이전 페이지
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 시스템 에러 Fallback
  return (
    <ErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />
  );
}
