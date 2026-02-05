import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { Suspense } from 'react';

export default function InviteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense fallback={<AuthLoadingScreen />}>
      <main className="flex flex-col min-h-screen w-full transition-colors duration-300 dark:bg-[#121212] dark:text-white bg-white text-itta-black">
        {children}
      </main>
    </Suspense>
  );
}
