'use client';

import { SessionProvider, getSession, signOut, useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { invalidateSessionCache } from '@/lib/api/auth';

const isNativePlatform = () =>
  typeof window !== 'undefined' &&
  !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
    .Capacitor?.isNativePlatform?.();

function SessionGuard({ children }: { children: React.ReactNode }) {
  const { status, data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const userType = useAuthStore((state) => state.userType);
  const logout = useAuthStore((state) => state.logout);

  // Capacitor 네이티브 앱: 포그라운드 복귀 시 세션 갱신
  // refetchOnWindowFocus가 네이티브 WebView에서 동작하지 않으므로 명시적으로 처리
  useEffect(() => {
    if (!isNativePlatform()) return;

    let cleanup: (() => void) | undefined;

    (async () => {
      const { App } = await import('@capacitor/app');
      const handle = await App.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) return;
        invalidateSessionCache();
        getSession();
      });
      cleanup = () => handle.remove();
    })();

    return () => {
      cleanup?.();
    };
  }, []);

  // 세션 확정 시 스플래시 숨기기
  useEffect(() => {
    if (status === 'loading') return;
    if (!isNativePlatform()) return;

    (async () => {
      try {
        const { SplashScreen } = await import('@capacitor/splash-screen');
        await SplashScreen.hide({ fadeOutDuration: 300 });
      } catch {}
    })();
  }, [status]);

  useEffect(() => {
    if (pathname.startsWith('/invite')) {
      return;
    }

    // 현재 경로가 로그인 페이지라면 가드 로직을 건너뜀 (무한 루프 방지)
    if (
      pathname === '/login' ||
      pathname.startsWith('/oauth/callback') ||
      pathname.startsWith('/invite')
    ) {
      if (status === 'authenticated') {
        router.replace('/');
      }
      return;
    }

    // 로딩 중에는 아무것도 하지 않음
    if (status === 'loading') return;

    // 세션 에러 또는 소셜 유저가 인증 실패한 경우에만 로그아웃 처리
    const hasSessionError = session?.error;
    const isUnauthenticated = status === 'unauthenticated';
    const isSocialUser = userType === 'social';

    // 소셜 유저가 인증 실패한 경우에만 처리 (게스트는 제외)
    if ((hasSessionError || isUnauthenticated) && isSocialUser) {
      logout();
      signOut({ redirectTo: '/login' });
      return; // 조기 종료로 중복 실행 방지
    }
  }, [status, session, pathname]);

  return <>{children}</>;
}

export default function AuthContext({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider refetchOnWindowFocus={true}>
      <SessionGuard>{children}</SessionGuard>
    </SessionProvider>
  );
}
