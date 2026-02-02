'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import * as Sentry from '@sentry/nextjs';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const checkInstallation = async () => {
      // 1. display-mode로 확인
      if (window.matchMedia('(display-mode: standalone)').matches) {
        requestAnimationFrame(() => {
          setIsInstalled(true);
        });
        return true;
      }

      // 2. getInstalledRelatedApps API로 확인 (Chrome 등 지원 브라우저)
      if ('getInstalledRelatedApps' in navigator) {
        try {
          const relatedApps = await (
            navigator as Navigator & {
              getInstalledRelatedApps: () => Promise<
                Array<{ platform: string }>
              >;
            }
          ).getInstalledRelatedApps();

          if (relatedApps.length > 0) {
            requestAnimationFrame(() => {
              setIsInstalled(true);
            });
            return true;
          }
        } catch (error) {
          // PWA 설치 상태 확인 실패는 정보성 경고
          Sentry.captureException(error, {
            level: 'warning',
            tags: {
              context: 'pwa',
              operation: 'check-installed-apps',
            },
          });
          console.error('getInstalledRelatedApps 확인 실패:', error);
        }
      }

      return false;
    };

    // beforeinstallprompt 이벤트 리스너
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    checkInstallation().then((installed) => {
      if (!installed) {
        window.addEventListener('beforeinstallprompt', handler);
      }
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const promptInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
          setIsInstalled(true);
        }

        setDeferredPrompt(null);
        return outcome;
      } catch (error) {
        // PWA 설치 프롬프트 실패는 UX에 영향
        Sentry.captureException(error, {
          level: 'error',
          tags: {
            context: 'pwa',
            operation: 'install-prompt',
          },
          extra: {
            hasDeferredPrompt: !!deferredPrompt,
          },
        });
        toast.error('앱 설치에 실패했습니다.\n잠시후 다시 시도해주세요.');
        return 'error';
      }
    }
    return null;
  };

  // 브라우저 감지
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  // Chrome, Edge 등은 Safari를 UserAgent에 포함하므로 제외
  const isSafari =
    /Safari/.test(userAgent) &&
    !/Chrome/.test(userAgent) &&
    !/Edg/.test(userAgent) &&
    !/CriOS/.test(userAgent);
  const isMacOS =
    /Macintosh|MacIntel|MacPPC|Mac68K/.test(userAgent) &&
    !/Chrome/.test(userAgent) &&
    !/Edg/.test(userAgent);

  return {
    deferredPrompt,
    isInstalled,
    promptInstall,
    isIOS,
    isSafari,
    isMacOS,
  };
}
