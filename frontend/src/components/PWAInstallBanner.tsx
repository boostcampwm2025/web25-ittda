import { auth } from '@/auth';
import { cookies } from 'next/headers';
import PWAInstallBannerClient from './PWAInstallBannerClient';
import { getCookieFromString } from '@/lib/utils/cookie';

const backendUrl =
  process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_PRODUCTION_API_URL
    : 'http://localhost:4000';

async function shouldShowBanner(): Promise<boolean> {
  const session = await auth();

  if (session?.accessToken) {
    // 로그인 사용자: DB settings 기반으로 판단
    try {
      const res = await fetch(`${backendUrl}/v1/me/settings`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
        next: { revalidate: 0 },
      });
      if (res.ok) {
        const body = (await res.json()) as { data?: Record<string, unknown> };
        const settings = body.data ?? {};
        if (settings.pwaBannerNeverShow === true) return false;
        const dismissedUntil = settings.pwaBannerDismissedUntil as
          | number
          | undefined;
        if (dismissedUntil && Date.now() < dismissedUntil) return false;
      }
    } catch {
      // 설정 조회 실패 시 배너 표시
    }
    return true;
  }

  // 게스트: 쿠키 기반으로 판단
  const cookieStore = await cookies();
  const allCookies = cookieStore.toString();

  if (getCookieFromString(allCookies, 'pwa-banner-never-show') === 'true') {
    return false;
  }

  const dismissedUntilStr = getCookieFromString(
    allCookies,
    'pwa-banner-dismissed-until',
  );
  if (dismissedUntilStr) {
    const dismissedUntil = parseInt(dismissedUntilStr);
    if (Date.now() < dismissedUntil) return false;
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
