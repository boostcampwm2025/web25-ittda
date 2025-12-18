import Back from '@/components/Back';
import Header from '@/components/Header';

export default function SelectLocationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="w-full flex flex-col h-full">
      <Header className="w-full shrink-0">
        <Header.Left>
          <Back size={25} />
        </Header.Left>
        <Header.Title>위치 선택</Header.Title>
      </Header>

      <div className="w-full h-full flex justify-center">
        <main className="flex flex-1 min-h-0 w-full justify-center mt-1 h-full">
          <div className="w-full h-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
