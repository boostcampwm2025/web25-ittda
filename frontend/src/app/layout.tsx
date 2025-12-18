import type { Metadata } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import MswLoader from '@/components/MswLoader';
import Providers from './providers';
import SideNavigation from '@/components/SideNavigation';
import BottomNavigation from '@/components/BottomNavigation';

const notoSans = Noto_Sans_KR({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Ittda',
  description: '',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${notoSans.variable} antialiased relative`}>
        <Providers>
          <MswLoader />
          {children}
          <SideNavigation />
          <BottomNavigation />
        </Providers>
      </body>
    </html>
  );
}
