'use client';

import { useEffect, useState } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import Image from 'next/image';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 이미 설치되었는지 확인
    if (window.matchMedia('(display-mode: standalone)').matches) {
      requestAnimationFrame(() => {
        setIsInstalled(true);
      });
      return;
    }

    // 배너를 닫은 적이 있는지 확인
    const dismissedUntil = localStorage.getItem('pwa-banner-dismissed-until');
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil)) {
      return;
    }

    // beforeinstallprompt 이벤트 리스너
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // beforeinstallprompt를 지원하지 않는 브라우저
    // (Safari, Vivaldi 등) - 바로 배너 표시
    const timeout = setTimeout(() => {
      if (!deferredPrompt) {
        setShowBanner(true);
      }
    }, 1000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timeout);
    };
  }, [deferredPrompt]);

  const [showInstructions, setShowInstructions] = useState(false);

  const handleInstallClick = async () => {
    // Chrome/Edge 등에서 기본 프롬프트 지원하는 경우
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
          setIsInstalled(true);
        }

        setShowBanner(false);
        setDeferredPrompt(null);
      } catch (error) {
        console.error('PWA 설치 실패:', error);
      }
    } else {
      // 프롬프트를 지원하지 않는 브라우저 (Safari, Vivaldi 등)
      // 커스텀 안내 모달 표시
      setShowInstructions(true);
    }
  };

  const handleClose = () => {
    setShowBanner(false);
    // 1일 동안 배너 숨김
    const dismissedUntil = Date.now() + 1 * 24 * 60 * 60 * 1000;
    localStorage.setItem(
      'pwa-banner-dismissed-until',
      dismissedUntil.toString(),
    );
  };

  if (isInstalled || !showBanner) {
    return null;
  }

  // 브라우저 감지
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
  const isMacOS = /Macintosh|MacIntel|MacPPC|Mac68K/.test(userAgent);

  return (
    <>
      {/* 설치 안내 모달 */}
      {showInstructions && (
        <div
          onClick={() => setShowInstructions(false)}
          className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative dark:bg-popover bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200"
          >
            <button
              onClick={() => setShowInstructions(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                앱 설치 방법
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                브라우저에서 앱을 설치하려면 아래 단계를 따라주세요.
              </p>
            </div>

            <div className="space-y-4">
              {isIOS ? (
                // Safari iOS
                <>
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-8 h-8 bg-itta-point/10 rounded-full flex items-center justify-center text-itta-point font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Safari 하단의&nbsp;
                        <span className="inline-flex items-center mx-1">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M18 8h2V6h-2v2zm0 4h2v-2h-2v2zm-4-8h2V2h-2v2zm4 0h2V2h-2v2z" />
                          </svg>
                        </span>
                        &nbsp;
                        <strong>(공유)</strong> 버튼을 누르세요.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-8 h-8 bg-itta-point/10 rounded-full flex items-center justify-center text-itta-point font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>&quot;홈 화면에 추가&quot;</strong>를
                        선택하세요.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-8 h-8 bg-itta-point/10 rounded-full flex items-center justify-center text-itta-point font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>&quot;추가&quot;</strong> 버튼을 누르면 완료!
                      </p>
                    </div>
                  </div>
                </>
              ) : isSafari && isMacOS ? (
                // Safari macOS
                <>
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-8 h-8 bg-itta-point/10 rounded-full flex items-center justify-center text-itta-point font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Safari 상단 메뉴에서 <strong>파일</strong> 또는&nbsp;
                        <span className="inline-flex items-center mx-1">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M18 8h2V6h-2v2zm0 4h2v-2h-2v2zm-4-8h2V2h-2v2zm4 0h2V2h-2v2z" />
                          </svg>
                        </span>
                        &nbsp;
                        <strong>(공유)</strong>를 클릭하세요.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-8 h-8 bg-itta-point/10 rounded-full flex items-center justify-center text-itta-point font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>&quot;Dock에 추가&quot;</strong>를 선택하세요.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-8 h-8 bg-itta-point/10 rounded-full flex items-center justify-center text-itta-point font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>&quot;추가&quot;</strong> 버튼을 누르면 완료!
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                // 기타 브라우저 (Vivaldi 등)
                <>
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-8 h-8 bg-itta-point/10 rounded-full flex items-center justify-center text-itta-point font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        브라우저 주소창 오른쪽의&nbsp;
                        <strong className="inline-flex items-center mx-1">
                          ⋮ (메뉴)
                        </strong>
                        &nbsp; 버튼을 누르세요.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-8 h-8 bg-itta-point/10 rounded-full flex items-center justify-center text-itta-point font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>&quot;앱 설치&quot;</strong> 또는&nbsp;
                        <strong>&quot;홈 화면에 추가&quot;</strong>를
                        선택하세요.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-8 h-8 bg-itta-point/10 rounded-full flex items-center justify-center text-itta-point font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>&quot;설치&quot;</strong> 버튼을 누르면 완료!
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowInstructions(false)}
              className="w-full mt-6 py-3 px-4 bg-itta-point text-white rounded-xl font-medium hover:bg-itta-point/90 active:scale-95 transition-all"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 배너 */}
      <div className="relative w-full">
        <div
          onClick={handleInstallClick}
          className="relative p-4 bg-linear-to-br from-itta-point to-itta-point/80 cursor-pointer overflow-hidden group hover:shadow-lg transition-all active:scale-[0.98]"
        >
          {/* 배경 패턴 */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full blur-2xl" />
          </div>

          {/* 닫기 버튼 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors z-10"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          <div className="rounded-2xl bg-[#121212] text-[12px] px-3 py-2 text-white absolute top-1/2 -translate-x-1/2 -translate-y-1/2 right-5">
            앱 설치하기
          </div>

          <div className="relative flex items-center gap-4">
            {/* 앱 아이콘 */}
            <div className="relative shrink-0 w-14 h-14 bg-white rounded-2xl p-2 shadow-lg">
              <Image
                src="/web-app-icon-192x192.png"
                alt="잇다- 앱 아이콘"
                width={56}
                height={56}
                className="w-full h-full object-contain"
              />
              {/* 다운로드 아이콘 */}
              <div className="absolute -right-2 -bottom-1 shrink-0 w-6 h-6 bg-[#121212] rounded-full flex items-center justify-center">
                <Download className="w-3 h-3 text-white" />
              </div>
            </div>

            {/* 텍스트 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-white text-base">
                  잇다- 앱으로 설치하기
                </h3>
                <Smartphone className="w-4 h-4 text-white/80" />
              </div>
              <p className="text-white/90 text-sm leading-snug">
                앱으로 더 간편하게, 모든 순간을 기록해보세요!
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
