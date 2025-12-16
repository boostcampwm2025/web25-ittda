import Header from '@/components/Header';
import SideFilterbar from './_components/SideFilterbar';
import SimpleMemo from './_components/SimpleMemo';
import SimpleInput from '@/components/SimpleInput';

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="w-full h-screen flex">
      <div className="flex flex-3 flex-col">
        <Header title="홈" className="w-full">
          <div className="pt-4">
            <SimpleInput
              showCheckIcon
              placeholder="간단히 메모할 사항을 작성해주세요."
            />
          </div>
        </Header>
        <div className="overflow-hidden mt-1">{children}</div>
      </div>

      <aside className="flex-1 h-full min-w-0 border-l-[0.5] border-itta-gray2 px-4.25 py-6.5">
        <SideFilterbar />
      </aside>
    </div>
  );
}
