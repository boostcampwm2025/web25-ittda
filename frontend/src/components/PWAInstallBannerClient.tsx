'use client';

import { useState } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import Image from 'next/image';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import PWAInstallModal from './PWAInstallModal';
import { setCookie } from '@/lib/utils/cookie';

export default function PWAInstallBannerClient() {
  const { isInstalled, promptInstall, isIOS, isSafari, isMacOS } =
    usePWAInstall();
  const [showBanner, setShowBanner] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleInstallClick = async () => {
    // Chrome/Edge 등에서 기본 프롬프트 지원하는 경우
    const outcome = await promptInstall();

    if (outcome === 'accepted') {
      setShowBanner(false);
    } else if (outcome === null) {
      // 프롬프트를 지원하지 않는 브라우저 (Safari, Vivaldi 등)
      // 커스텀 안내 모달 표시
      setShowInstructions(true);
    } else if (outcome === 'dismissed') {
      setShowBanner(false);
    }
  };

  const handleClose = () => {
    setShowBanner(false);
    // 2주(14일) 동안 배너 숨김 - 쿠키에 저장
    const dismissedUntil = Date.now() + 14 * 24 * 60 * 60 * 1000;
    setCookie('pwa-banner-dismissed-until', dismissedUntil.toString(), {
      days: 14,
    });
  };

  const handleNeverShowAgain = () => {
    setShowBanner(false);
    // 영구적으로 배너 숨김 - 쿠키에 저장
    setCookie('pwa-banner-never-show', 'true', { days: 365 * 10 }); // 10년
  };

  if (isInstalled || !showBanner) {
    return null;
  }

  return (
    <>
      {/* 설치 안내 모달 */}
      <PWAInstallModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        isIOS={isIOS}
        isSafari={isSafari}
        isMacOS={isMacOS}
      />

      {/* 배너 */}
      <div className="relative w-full">
        <div
          onClick={handleInstallClick}
          className="relative p-4 bg-linear-to-br from-itta-point to-itta-point/80 cursor-pointer overflow-hidden group hover:shadow-lg transition-all"
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

          <div className="hidden sm:block rounded-2xl bg-[#121212] text-[12px] px-3 py-2 text-white absolute top-1/2 -translate-x-1/2 -translate-y-1/2 right-5">
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

          {/* 다시 보지 않기 버튼 */}
          <div className="w-full flex justify-center items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNeverShowAgain();
              }}
              className="relative mt-2 w-fit py-1.5 text-xs text-white/70 hover:text-white/90 transition-colors underline underline-offset-2 z-10"
            >
              다시 보지 않기
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
