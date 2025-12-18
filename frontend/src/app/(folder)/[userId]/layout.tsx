import Header from '@/components/Header';
import SideFilterbar from '@/app/(main)/_components/SideFilterbar';

export default function UserFolderLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="w-full h-screen flex flex-col">
      <Header className="w-full shrink-0">
        <Header.Title>나의 기록 - 일기/여행</Header.Title>
      </Header>

      <div className="flex flex-1 min-h-0 w-full justify-center mt-1">
        <main className="flex flex-1 min-h-0 w-full">
          <div className="flex-3 overflow-y-auto">{children}</div>

          <aside className="flex-1 h-full overflow-y-auto border-l-[0.5px] border-itta-gray2 px-4.25 py-6.5">
            <SideFilterbar />
          </aside>
        </main>
      </div>
    </div>
  );
}

