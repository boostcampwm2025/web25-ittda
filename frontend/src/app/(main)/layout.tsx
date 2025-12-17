import Header from '@/components/Header';
import SideFilterbar from './_components/SideFilterbar';
import SimpleInput from '@/components/SimpleInput';

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="w-full h-screen flex flex-col">
      {/* 헤더 - 고정 */}
      <Header title="홈" className="w-full shrink-0">
        <div className="w-full max-w-2xl">
          <SimpleInput
            showCheckIcon
            placeholder="간단히 메모할 사항을 작성해주세요."
          />
        </div>
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
