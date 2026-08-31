'use client';

import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

/**
 * Android 네이티브 앱의 status bar 영역을 앱 배경색으로 덮는 고정 오버레이.
 * CSS dark: 클래스로 테마 색상을 적용해 hydration 이슈 없이 동작.
 */
export default function StatusBarCover() {
  const pathname = usePathname();
  const isMapPath = pathname.includes('map');

  return (
    <div
      data-status-bar-cover
      className={cn(
        'fixed top-0 left-0 right-0 pointer-events-none bg-white dark:bg-[#121212]',
        isMapPath && 'opacity-0',
      )}
      style={{
        height: 'env(safe-area-inset-top)',
        zIndex: 51,
      }}
    />
  );
}
