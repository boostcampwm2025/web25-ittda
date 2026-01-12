import { Suspense } from 'react';

export default function SearchLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="w-full h-screen flex flex-col">
      <div className="flex flex-1 min-h-0 w-full justify-center">
        <Suspense fallback={<div>로딩</div>}>
          <main className="flex-1 overflow-hidden">{children}</main>
        </Suspense>
      </div>
    </div>
  );
}
