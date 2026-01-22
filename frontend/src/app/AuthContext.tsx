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
    if (status !== 'loading' && !session && userType === 'social') {
      requestAnimationFrame(() => {
        logout();
        router.replace('/login');
      });
    }

    if (status === 'loading') return;

    if (status === 'authenticated' && pathname === '/login') {
      router.replace('/');
    }
  }, [status, userType, logout, router, pathname]);

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
