import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';

export default function SearchLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      data-search-layout
      className="w-full flex flex-col overflow-hidden flex-1 min-h-0"
      // style={{ maxHeight: 'calc(100svh - env(safe-area-inset-top, 0px))' }}
    >
      <div className="flex flex-1 min-h-0 w-full justify-center">
        <Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-[#121212]">
              <Loader2 className="w-8 h-8 animate-spin text-itta-point" />
            </div>
          }
        >
          <main className="h-full">{children}</main>
        </Suspense>
      </div>
    </div>
  );
}
