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
    // 토큰 갱신 실패로 세션에 에러가 있으면 자동 로그아웃
    if (session?.error) {
      logout();
      router.replace('/login');
      return;
    }

    if (status !== 'loading' && !session && userType === 'social') {
      const raId = requestAnimationFrame(() => {
        logout();
        router.replace('/login');
      });
      return () => cancelAnimationFrame(raId);
    }

    if (status === 'loading') return;

    if (status === 'authenticated' && pathname === '/login') {
      router.replace('/');
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
