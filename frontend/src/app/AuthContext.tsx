'use client';

import { SessionProvider, useSession } from 'next-auth/react';
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
    if (pathname === '/login') {
      if (status === 'authenticated') {
        router.replace('/');
      }
      return;
    }

    if (status === 'loading') return;

    // 토큰 에러 또는 인증 만료 시 로그아웃 처리
    const isUnauthenticated = !session || session.error;

    // 로그인이 필요한 상태인데 세션이 없는 경우 (로그인 유저 타입 체크)
    if (isUnauthenticated && userType === 'social') {
      logout();
      router.replace('/login');
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
    <SessionProvider refetchOnWindowFocus={true} refetchInterval={5 * 60}>
      <SessionGuard>{children}</SessionGuard>
    </SessionProvider>
  );
}
