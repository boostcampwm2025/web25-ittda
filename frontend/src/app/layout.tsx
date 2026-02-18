import type { Metadata, Viewport } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import MswLoader from '@/components/MswLoader';
import Providers from './providers';
import BottomNavigation from '@/components/BottomNavigation';
import Script from 'next/script';
import ConditionalHeader from '@/components/ConditionalHeader';
import { ThemeProvider } from 'next-themes';
import ThemeColorSetter from '@/components/ThemeColorSetter';
import PWAInstallBanner from '@/components/PWAInstallBanner';
import KakaoScript from '@/lib/services/kakaoScript';
import AuthContext from './AuthContext';
import { Suspense } from 'react';

const notoSans = Noto_Sans_KR({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: {
    default: '잇다-',
    template: '%s',
  },
  description: '친구들과 쉽게 공유하고 소통할 수 있는 새로운 방법, 잇다-',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/web-app-icon-192x192.png',
    apple: '/apple-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '잇다-',
    startupImage: [
      {
        url: '/splash/apple-splash-2048-2732.png',
        media:
          '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: '/splash/apple-splash-1668-2388.png',
        media:
          '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: '/splash/apple-splash-1536-2048.png',
        media:
          '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: '/splash/apple-splash-1640-2360.png',
        media:
          '(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: '/splash/apple-splash-1668-2224.png',
        media:
          '(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: '/splash/apple-splash-1620-2160.png',
        media:
          '(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: '/splash/apple-splash-1488-2266.png',
        media:
          '(device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: '/splash/apple-splash-1320-2868.png',
        media:
          '(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: '/splash/apple-splash-1260-2736.png',
        media:
          '(device-width: 420px) and (device-height: 912px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: '/splash/apple-splash-1206-2622.png',
        media:
          '(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: '/splash/apple-splash-1290-2796.png',
        media:
          '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: '/splash/apple-splash-1179-2556.png',
        media:
          '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: '/splash/apple-splash-1170-2532.png',
        media:
          '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: '/splash/apple-splash-1284-2778.png',
        media:
          '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: '/splash/apple-splash-1125-2436.png',
        media:
          '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: '/splash/apple-splash-1242-2688.png',
        media:
          '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: '/splash/apple-splash-828-1792.png',
        media:
          '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: '/splash/apple-splash-1242-2208.png',
        media:
          '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: '/splash/apple-splash-750-1334.png',
        media:
          '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: '/splash/apple-splash-640-1136.png',
        media:
          '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
    ],
  },
  openGraph: {
    title: '개인의 기록을 넘어, 함께 만드는 추억',
    description: '친구들과 쉽게 공유하고 소통할 수 있는 새로운 방법, 잇다-',
    type: 'website',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/thumbnail.png`,
        width: 1200,
        height: 630,
        alt: '잇다- 서비스 설명',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="scrollbar-hide" suppressHydrationWarning>
      <head>
        {/* 테마 깜빡임을 방지하기 위한 인라인 스크립트 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  const supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const isDark = theme === 'dark' || (theme === 'system' && supportDarkMode) || (!theme && supportDarkMode);
                  const color = isDark ? '#121212' : '#ffffff';
                  
                  // 메타 태그 생성 또는 수정
                  let meta = document.querySelector('meta[name="theme-color"]');
                  if (!meta) {
                    meta = document.createElement('meta');
                    meta.name = 'theme-color';
                    document.head.appendChild(meta);
                  }
                  meta.setAttribute('content', color);
                  
                  // 시스템 배경색과 일치시키기 위해 <html> 클래스도 미리 제어
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${notoSans.variable} antialiased relative`}
        suppressHydrationWarning
      >
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`}
          strategy="beforeInteractive"
        />
        <KakaoScript />
        <AuthContext>
          <Providers>
            <MswLoader />
            <ThemeProvider
              attribute="class"
              enableSystem={true}
              defaultTheme="system"
            >
              <ThemeColorSetter />
              <div className="flex flex-col min-h-screen w-full mx-auto shadow-2xl max-w-4xl relative transition-colors duration-300 dark:bg-[#121212] dark:text-white bg-white text-itta-black">
                <PWAInstallBanner />
                <ConditionalHeader />
                {children}
                <Suspense fallback={null}>
                  <BottomNavigation />
                </Suspense>
              </div>
            </ThemeProvider>
          </Providers>
        </AuthContext>
      </body>
    </html>
  );
}
