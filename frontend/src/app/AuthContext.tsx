'use client';

import {
  SessionProvider,
  getSession,
  signOut,
  useSession,
} from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/store/useAuthStore';
import { invalidateSessionCache } from '@/lib/api/auth';

const isNativePlatform = () =>
  typeof window !== 'undefined' &&
  !!(
    window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }
  ).Capacitor?.isNativePlatform?.();

function SessionGuard({ children }: { children: React.ReactNode }) {
  const { status, data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const userType = useAuthStore((state) => state.userType);
  const logout = useAuthStore((state) => state.logout);
  const { resolvedTheme } = useTheme();

  // skipHydration: true이므로 마운트 후 localStorage에서 상태 복원
  useEffect(() => {
    useAuthStore.persist.rehydrate();
  }, []);

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

  // [1단계] 세션 + 테마 확정 후 status bar 테마 적용 → 스플래시 숨기기
  // resolvedTheme를 기다려야 올바른 테마로 status bar를 설정할 수 있음
  useEffect(() => {
    if (status === 'loading') return;
    if (!resolvedTheme) return;
    if (!isNativePlatform()) return;

    (async () => {
      const platform = (
        window as unknown as { Capacitor?: { getPlatform?: () => string } }
      ).Capacitor?.getPlatform?.();
      const androidTheme = resolvedTheme === 'dark' ? 'dark' : 'light';
      const androidBridge = (
        window as unknown as {
          AndroidBridge?: { themeChange: (t: string) => void; appReady: () => void };
        }
      ).AndroidBridge;

      // SplashScreen 페이드아웃 전: 커버뷰 배경색 + 아이콘 색상 먼저 설정
      if (platform === 'android') {
        androidBridge?.themeChange(androidTheme);
        androidBridge?.appReady();
      } else {
        try {
          const { StatusBar, Style } = await import('@capacitor/status-bar');
          await StatusBar.setStyle({
            style: resolvedTheme === 'dark' ? Style.Light : Style.Dark,
          });
        } catch {}
      }

      try {
        const { SplashScreen } = await import('@capacitor/splash-screen');
        await SplashScreen.hide({ fadeOutDuration: 300 });
      } catch {}

      // SplashScreen hide 완료 후 재적용: hide() 내부에서 플래그가 리셋될 수 있음
      if (platform === 'android') {
        androidBridge?.themeChange(androidTheme);
      }
    })();
  }, [status, resolvedTheme]);

  // [2단계] status 확정 시 resolvedTheme와 무관하게 Android appReady() 호출 보장
  // next-themes가 resolvedTheme를 늦게 확정하는 경우 스플래시가 무한 대기하는 것 방지
  useEffect(() => {
    if (status === 'loading') return;
    if (!isNativePlatform()) return;

    const platform = (
      window as unknown as { Capacitor?: { getPlatform?: () => string } }
    ).Capacitor?.getPlatform?.();
    if (platform !== 'android') return;

    // resolvedTheme가 이미 확정됐으면 [1단계]에서 처리하므로 여기선 skip
    if (resolvedTheme) return;

    // resolvedTheme 미확정인 채로 status만 확정된 경우: 테마 없이 appReady만 호출
    const androidBridge = (
      window as unknown as {
        AndroidBridge?: { appReady: () => void };
      }
    ).AndroidBridge;
    androidBridge?.appReady();
  }, [status, resolvedTheme]);

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
    <SessionProvider refetchOnWindowFocus={false}>
      <SessionGuard>{children}</SessionGuard>
    </SessionProvider>
  );
}
