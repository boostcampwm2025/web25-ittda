'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';

/**
 * iOS/Android 네이티브 statusbar 테마를 전역으로 동기화.
 * - pathname/theme 변경 시 기본 테마 전송 (map = transparent, 그 외 = dark/light)
 * - vaul drawer overlay 감지 → 열리면 map-overlay(반투명 어둠), 닫히면 기본 테마 복원
 */
function sendNativeStatusBarTheme(theme: string) {
  // iOS: WKWebView messageHandler
  try {
    (
      window as unknown as {
        webkit?: {
          messageHandlers?: { themeChange?: { postMessage: (t: string) => void } };
        };
      }
    ).webkit?.messageHandlers?.themeChange?.postMessage(theme);
  } catch {}
  // Android: JavascriptInterface
  try {
    (
      window as unknown as { AndroidBridge?: { themeChange: (t: string) => void } }
    ).AndroidBridge?.themeChange(theme);
  } catch {}
}

export default function NativeStatusBarSync() {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const isMapPage = pathname.includes('map');
  const baseThemeRef = useRef<string>('light');

  // pathname 또는 테마 변경 시 기본 테마 갱신 + 전송 (drawer가 없을 때만)
  useEffect(() => {
    const base = isMapPage ? 'transparent' : resolvedTheme === 'dark' ? 'dark' : 'light';
    baseThemeRef.current = base;

    const hasOpenDrawer = !!document.querySelector(
      '[data-slot="drawer-overlay"][data-state="open"]',
    );
    if (!hasOpenDrawer) {
      sendNativeStatusBarTheme(base);
    }
  }, [isMapPage, resolvedTheme]);

  // vaul drawer overlay 전역 감지
  useEffect(() => {
    const onMutation = () => {
      const isOpen = !!document.querySelector(
        '[data-slot="drawer-overlay"][data-state="open"]',
      );
      // drawer 열릴 때 native를 transparent로 → CSS overlay(bg-black/50 backdrop-blur-sm)가
      // statusbar 영역까지 통일된 디자인으로 표시 (iOS/Android 공통)
      sendNativeStatusBarTheme(isOpen ? 'transparent' : baseThemeRef.current);
    };

    const observer = new MutationObserver(onMutation);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-state'],
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
