import type { Metadata } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import MswLoader from '@/components/MswLoader';
import Providers from './providers';
import BottomNavigation from '@/components/BottomNavigation';
import Script from 'next/script';
import ConditionalHeader from '@/components/ConditionalHeader';

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
    <html lang="ko" className="scrollbar-hide">
      <body className={`${notoSans.variable} antialiased relative`}>
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
          strategy="beforeInteractive"
        />
        <Providers>
          <MswLoader />
          <div className="flex flex-col min-h-screen w-full mx-auto shadow-2xl max-w-4xl relative transition-colors duration-300 dark:bg-[#121212] dark:text-white bg-white text-itta-black">
            <ConditionalHeader />
            {children}
            <BottomNavigation />
          </div>
        </Providers>
      </body>
    </html>
  );
}
