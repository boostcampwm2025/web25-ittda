'use client';

import { ServerCrash } from 'lucide-react';

/**
 * 서버 장애 시 전체 화면 오버레이를 띄우는 컴포넌트.
 *
 * 활성화 방법: Vercel 대시보드 → Environment Variables에서
 * NEXT_PUBLIC_MAINTENANCE_MODE=true 추가 후 재배포(~1분).
 * 서버 연결 없이 클라이언트 빌드 타임에 결정되므로 서버 다운 시에도 동작.
 */
export default function ServiceGuard() {
  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE !== 'true') return null;

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white dark:bg-[#121212] px-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center">
          <ServerCrash className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
        <div className="space-y-1.5">
          <p className="text-base font-bold text-gray-900 dark:text-white">
            서비스 점검 중입니다
          </p>
          <p className="text-sm text-gray-400 leading-relaxed">
            더 나은 서비스를 위해 점검 중입니다.
            <br />
            불편을 드려 죄송합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
