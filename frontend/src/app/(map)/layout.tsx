import Header from '@/components/Header';

export default function MapLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="w-full h-screen flex flex-col">
      <Header title="지도" />

      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
