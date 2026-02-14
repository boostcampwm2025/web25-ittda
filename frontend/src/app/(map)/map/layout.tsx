import Header from '@/components/Header';

export default function MapLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="w-full h-screen h-[100dvh] flex flex-col">
      <div className="hidden md:block">
        <Header />
      </div>

      <div className="flex flex-1 min-h-0 w-full justify-center">
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
