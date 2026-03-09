'use client';

import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';

/**
 * iOS safe area 상단(status bar 영역)을 앱 배경색으로 덮는 고정 오버레이.
 * position: fixed + zIndex 9999 인라인 스타일로 스크롤과 무관하게 항상 표시.
 * ThemeColorSetter와 동일하게 JS로 배경색을 적용해 다크/라이트 모드에서도 확실히 동작.
 */
export default function StatusBarCover() {
  const { resolvedTheme } = useTheme();
  const pathname = usePathname();
  const bg = resolvedTheme === 'dark' ? '#121212' : '#ffffff';
  const isMapPath = pathname.includes('map');

  return (
    <div
      data-status-bar-cover
      className={cn(
        'fixed, top-0 left-0 right-0 z-300 pointer-events-none',
        isMapPath && 'opacity-100',
      )}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 'env(safe-area-inset-top)',
        zIndex: 300,
        pointerEvents: 'none',
        backgroundColor: isMapPath ? 'transparent' : bg,
      }}
    />
  );
}
