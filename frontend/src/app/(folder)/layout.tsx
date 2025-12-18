import Header from '@/components/Header';

export default function FolderLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="w-full h-screen flex flex-col overflow-y-auto">
      <Header>
        <Header.Title>나의 기록 - 일기/여행</Header.Title>
      </Header>
      <div className="flex flex-1 w-full justify-center">
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
