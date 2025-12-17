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
        <div className="pt-4">
          <SimpleInput
            showCheckIcon
            placeholder="간단히 메모할 사항을 작성해주세요."
          />
        </div>
      </Header>

      {/* 콘텐츠 영역 - 나머지 공간 차지 */}
      <div className="flex flex-1 min-h-0 w-full mt-1">
        {/* 메인 콘텐츠 - 3:1 비율 중 3 */}
        <div className="flex-3 overflow-y-auto">{children}</div>

        {/* 사이드 필터바 - 3:1 비율 중 1 */}
        <aside className="flex-1 h-full overflow-y-auto border-l-[0.5px] border-itta-gray2 px-4.25 py-6.5">
          <SideFilterbar />
        </aside>
      </div>
    </div>
  );
}
