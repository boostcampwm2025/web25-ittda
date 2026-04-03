'use client';

import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { toast } from 'sonner';

/**
 * Android 하드웨어/제스처 뒤로가기 처리 컴포넌트.
 * - 뒤로 갈 히스토리가 있으면 → history.back()
 * - 루트(히스토리 없음)에서 한 번 → "한 번 더 누르면 종료" 토스트
 * - 2초 내 한 번 더 → 앱 종료
 */
export default function AndroidBackHandler() {
  useEffect(() => {
    const platform = (
      window as unknown as { Capacitor?: { getPlatform?: () => string } }
    ).Capacitor?.getPlatform?.();
    if (platform !== 'android') return;

    let backPressedOnce = false;
    let timer: ReturnType<typeof setTimeout>;

    // 같은 pathname의 검색 파라미터 변경 히스토리를 건너뛰어 이전 "실제 페이지"로 이동
    const goBackToRealPage = () => {
      const originPathname = window.location.pathname;

      const tryBack = () => {
        const onPopState = () => {
          if (window.location.pathname === originPathname) {
            // 같은 페이지(검색 파라미터만 다름) → 한 번 더 뒤로
            tryBack();
          }
          // 다른 pathname으로 이동됐으면 완료
        };
        window.addEventListener('popstate', onPopState, { once: true });
        window.history.back();
      };

      tryBack();
    };

    const listenerPromise = App.addListener('backButton', (data) => {
      if (data.canGoBack) {
        goBackToRealPage();
        return;
      }

      if (backPressedOnce) {
        clearTimeout(timer);
        App.exitApp();
        return;
      }

      backPressedOnce = true;
      toast('뒤로 가기를 한 번 더 누르면 앱이 종료됩니다.', {
        duration: 2000,
      });

      timer = setTimeout(() => {
        backPressedOnce = false;
      }, 2000);
    });

    return () => {
      clearTimeout(timer);
      listenerPromise.then((handle) => handle.remove());
    };
  }, []);

  return null;
}
