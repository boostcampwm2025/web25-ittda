'use client';

import { SessionProvider, signOut, useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

function SessionGuard({ children }: { children: React.ReactNode }) {
  const { status, data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const userType = useAuthStore((state) => state.userType);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
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
  }, [status, userType, logout, router, pathname, session]);

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
