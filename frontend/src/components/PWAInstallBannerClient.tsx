'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import PWAInstallModal from './PWAInstallModal';
import { setCookie } from '@/lib/utils/cookie';
import { usePathname } from 'next/navigation';
import { isPrivateMode } from '@/lib/utils/browserDetect';
import { useAuthStore } from '@/store/useAuthStore';
import { useApiPatch } from '@/hooks/useApi';

export default function PWAInstallBannerClient() {
  const {
    isInstalled,
    isCheckComplete,
    promptInstall,
    isIOS,
    isSafari,
    isMacOS,
  } = usePWAInstall();
  const [showBanner, setShowBanner] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isPrivateBrowsing, setIsPrivateBrowsing] = useState(false);
  const [isPrivateCheckDone, setIsPrivateCheckDone] = useState(false);

  const pathname = usePathname();
  const userId = useAuthStore((state) => state.userId);

  const { mutate: updateSettings } = useApiPatch<
    unknown,
    { settings: Record<string, unknown> }
  >('/api/me/settings');

  // 시크릿 모드 감지
  useEffect(() => {
    isPrivateMode().then((isPrivate) => {
      setIsPrivateBrowsing(isPrivate);
      setIsPrivateCheckDone(true);
    });
  }, []);

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

  // 플로팅 버튼의 닫기(X)는 유일한 닫기 동작이라 스누즈 없이 바로 영구적으로 숨긴다.
  const handleClose = () => {
    setShowBanner(false);
    if (userId) {
      updateSettings({ settings: { pwaBannerNeverShow: true } });
    } else {
      // 게스트: 쿠키에 영구 저장
      setCookie('pwa-banner-never-show', 'true', { days: 365 * 10 });
    }
  };

  // 모든 비동기 체크가 완료되기 전까지는 배너를 렌더링하지 않되(flash 방지),
  // 체크가 진행 중이라는 걸 알리는 마커는 남겨둔다 — 코치마크가 이 마커를 보고
  // 배너 표시 여부가 확정될 때까지(=레이아웃이 밀릴 일이 없어질 때까지) 대기한다.
  if (!isCheckComplete || !isPrivateCheckDone) {
    return <div data-pwa-banner-pending className="hidden" aria-hidden />;
  }

  if (isInstalled || !showBanner || isPrivateBrowsing) {
    return null;
  }

  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/oauth/callback') ||
    pathname.startsWith('/invite')
  ) {
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

      <div
        className="fixed z-60 bottom-24 left-4 md:left-6 xl:left-[calc(50vw-32rem)]"
        data-pwa-banner
      >
        <button
          type="button"
          onClick={handleInstallClick}
          aria-label="앱 설치 안내 보기"
          className="flex items-center justify-center w-12 h-12 rounded-full bg-white text-itta-black border border-gray-100 dark:bg-itta-black dark:text-white dark:border-transparent shadow-lg shadow-black/10 dark:shadow-black/40 hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
        >
          {/* 버튼 배경 자체가 이미 원이라, HelpCircle 아이콘(물음표+원 이중 테두리)
              대신 물음표 글자만 사용해 원이 겹치지 않게 한다. */}
          <span className="text-xl font-bold leading-none">?</span>
        </button>
        <button
          type="button"
          onClick={handleClose}
          aria-label="앱 설치 안내 닫기"
          className="absolute -top-0.5 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-gray-600 hover:bg-gray-700 text-white transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </>
  );
}
