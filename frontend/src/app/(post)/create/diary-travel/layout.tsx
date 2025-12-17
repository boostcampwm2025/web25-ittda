import Header from '@/components/Header';
import { ChevronLeft } from 'lucide-react';

export default function PostLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="w-full flex flex-col">
      <Header className="w-full shrink-0">
        <Header.Left>
          <ChevronLeft color="var(--itta-black)" size={45} />
        </Header.Left>
        <Header.Title>기록 추가 - 일기/여행</Header.Title>
      </Header>

      {children}
    </div>
  );
}
