import Header from '@/components/Header';
import { ChevronLeft } from 'lucide-react';

export default function FolderLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="w-full h-screen flex flex-col overflow-y-auto">
      <Header>
        <Header.Left>
          <ChevronLeft color="var(--itta-black)" size={25} />
        </Header.Left>
        <Header.Title>나의 기록 - 일기/여행</Header.Title>
      </Header>
      <div className="flex flex-1 w-full justify-center">
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
