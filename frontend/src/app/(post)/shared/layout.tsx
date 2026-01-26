import { Suspense } from 'react';
import SharedHeaderActions from './_components/SharedHeaderActions';

export default function SharedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="p-6 space-y-8 pb-32 transition-colors duration-300 min-h-full dark:bg-[#121212] bg-[#FDFDFD]">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight dark:text-white text-[#222222]">
          함께 기록함
        </h2>
        <div className="flex items-center gap-2">
          <Suspense>
            <SharedHeaderActions />
          </Suspense>
        </div>
      </div>

      {children}
    </main>
  );
}
