'use client';

import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { toast } from 'sonner';

/**
 * Android 하드웨어/제스처 뒤로가기 처리 컴포넌트.
 * - drawer 등 오버레이가 열려 있으면 → 오버레이 닫기 (핸들러 스택)
 * - 뒤로 갈 히스토리가 있으면 → history.back()
 * - 루트(히스토리 없음)에서 한 번 → "한 번 더 누르면 종료" 토스트
 * - 2초 내 한 번 더 → 앱 종료
 */

type BackHandler = () => void;
const backHandlerStack: BackHandler[] = [];

export function pushBackHandler(handler: BackHandler): () => void {
  backHandlerStack.push(handler);
  return () => {
    const idx = backHandlerStack.lastIndexOf(handler);
    if (idx >= 0) backHandlerStack.splice(idx, 1);
  };
}

export default function AndroidBackHandler() {
  useEffect(() => {
    const platform = (
      window as unknown as { Capacitor?: { getPlatform?: () => string } }
    ).Capacitor?.getPlatform?.();
    if (platform !== 'android') return;

    let backPressedOnce = false;
    let timer: ReturnType<typeof setTimeout>;

    const goBackToRealPage = () => {
      const originPathname = window.location.pathname;

      const tryBack = () => {
        const onPopState = () => {
          if (window.location.pathname === originPathname) {
            tryBack();
          }
        };
        window.addEventListener('popstate', onPopState, { once: true });
        window.history.back();
      };

      tryBack();
    };

    const listenerPromise = App.addListener('backButton', (data) => {
      // 오버레이(drawer 등)가 열려 있으면 최상단 핸들러 실행
      if (backHandlerStack.length > 0) {
        backHandlerStack[backHandlerStack.length - 1]();
        return;
      }

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
      toast.info('뒤로 가기를 한 번 더 누르면 앱이 종료됩니다.');

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
