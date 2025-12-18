import type { Metadata } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import MswLoader from "@/components/MswLoader";
import Providers from "./providers";

const notoSans = Noto_Sans_KR({
  variable: '--font-geist-sans', // CSS 변수 이름을 지정
  subsets: ['latin'], // 사용할 글리프 범위
}); // Next.js의 폰트 최적화 기능을 사용

export const metadata: Metadata = {
  title: 'Ittda', // 브라우저 탭 제목
  description: '', // 페이지 설명 (검색엔진, SNS 공유 시 활용)
}; // 이 레이아웃에 적용될 SEO 메타데이터를 정의

export default function RootLayout({
  // RootLayout: App Router에서 모든 페이지의 공통 레이아웃을 정의하는 컴포넌트
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${notoSans.variable} antialiased`}>
        <Providers>
          <MswLoader />{children}</Providers></body>
    </html>
  );
  // notoSans.variable을 통해 CSS 클래스에 폰트를 적용
  // antialiased: 텍스트 렌더링을 부드럽게 하는 Tailwind CSS 유틸리티 클래스
}

/*
폰트 최적화 기능)

폰트 파일을 직접 다운로드하지 않아도 됨
자동으로 CSS 변수 생성
성능 최적화 (FOIT(Flash Of Invisible Text)/FOUT(Flash Of Unstyled Text) 문제 줄임)
*/
