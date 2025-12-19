import Back from '@/components/Back';
import Header from '@/components/Header';

export default function PostLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="w-full flex flex-col">
      <Header className="w-full shrink-0">
        <Header.Left>
          <Back size={25} />
        </Header.Left>
        <Header.Title>기록 추가 - 일기/여행</Header.Title>
      </Header>

      <div className="flex flex-1 min-h-0 w-full justify-center mt-1">
        {children}
      </div>
    </div>
  );
}
