import Header from '@/components/Header';
import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';

export default function MapLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="w-full h-screen flex flex-col">
      <div className="hidden md:block">
        <Header />
      </div>

      <div className="flex flex-1 min-h-0 w-full justify-center">
        <Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-[#121212]">
              <Loader2 className="w-8 h-8 animate-spin text-itta-point" />
            </div>
          }
        >
          <main className="flex-1 overflow-hidden">{children}</main>
        </Suspense>
      </div>
    </div>
  );
}
