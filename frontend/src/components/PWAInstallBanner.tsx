import { cookies } from 'next/headers';
import PWAInstallBannerClient from './PWAInstallBannerClient';
import { getCookieFromString } from '@/lib/utils/cookie';

async function shouldShowBanner(): Promise<boolean> {
  const cookieStore = await cookies();
  const allCookies = cookieStore.toString();

  // '다시 보지 않기'를 선택한 경우 영구적으로 숨김
  const neverShowAgain = getCookieFromString(
    allCookies,
    'pwa-banner-never-show',
  );
  if (neverShowAgain === 'true') {
    return false;
  }

  // 배너를 닫은 적이 있는지 확인
  const dismissedUntilStr = getCookieFromString(
    allCookies,
    'pwa-banner-dismissed-until',
  );
  if (dismissedUntilStr) {
    const dismissedUntil = parseInt(dismissedUntilStr);
    if (Date.now() < dismissedUntil) {
      return false;
    }
  }

  return true;
}

export default async function PWAInstallBanner() {
  const showBanner = await shouldShowBanner();

  if (!showBanner) {
    return null;
  }

  return <PWAInstallBannerClient />;
}
