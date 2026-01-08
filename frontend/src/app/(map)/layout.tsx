// import Header from '@/components/Header';

export default function MapLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="w-full h-screen flex flex-col">
      {/* <Header>
        <Header.Title>지도</Header.Title>
      </Header> */}

      <div className="flex flex-1 min-h-0 w-full justify-center">
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
