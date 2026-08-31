import type { Metadata, Viewport } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import MswLoader from '@/components/MswLoader';
import Providers from './providers';
import BottomNavigation from '@/components/BottomNavigation';
import ConditionalHeader from '@/components/ConditionalHeader';
import { ThemeProvider } from 'next-themes';
import ThemeColorSetter from '@/components/ThemeColorSetter';
import PWAInstallBanner from '@/components/PWAInstallBanner';
import KakaoScript from '@/lib/services/kakaoScript';
import AuthContext from './AuthContext';
import { Suspense } from 'react';
import StatusBarCover from '@/components/StatusBarCover';
import NativeStatusBarSync from '@/components/NativeStatusBarSync';
import NetworkGuard from '@/components/NetworkGuard';
import AndroidBackHandler from '@/components/AndroidBackHandler';
import ServiceGuard from '@/components/ServiceGuard';
import AndroidNotificationHandler from '@/components/AndroidNotificationHandler';
import ServiceWorkerUpdater from '@/components/ServiceWorkerUpdater';
import { GoogleAnalytics } from '@next/third-parties/google';

const notoSans = Noto_Sans_KR({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-visual',
};

export const metadata: Metadata = {
  metadataBase: (() => {
    const base =
      process.env.NEXT_PUBLIC_CLIENT_URL ?? 'https://ittda.vercel.app';
    return new URL(base.startsWith('http') ? base : `http://${base}`);
  })(),
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
        {/* SSR 시점부터 manifest 링크가 <head>에 포함되도록 직접 선언
            Next.js metadata의 manifest 필드는 클라이언트 hydration 이후 추가되어
            새로고침 시 Chrome이 manifest를 감지하지 못하는 문제가 있음 */}
        <link rel="manifest" href="/manifest.webmanifest" />
        {/* 서비스 워커 등록 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js').catch(function() {});
                navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/firebase-cloud-messaging-push-scope' })
                  .catch(function() {});
              }
            `,
          }}
        />
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
                // Capacitor 네이티브 앱 감지 → sticky 헤더 safe-area 오프셋용 클래스 부여
                if (window.Capacitor?.isNativePlatform?.()) {
                  document.documentElement.classList.add('cap-native');
                  // WebView 배경색을 즉시 설정: 스플래시 fadeOut 시 검은 화면 방지
                  // 웹 브라우저에서는 CSS 클래스(dark:bg-[#121212])가 처리하므로 인라인 스타일 불필요
                  document.documentElement.style.backgroundColor = isDark ? '#121212' : '#ffffff';
                  document.body.style.backgroundColor = isDark ? '#121212' : '#ffffff';
                }
                // Android 감지 → drawer overlay가 statusbar까지 CSS로 처리
                if (window.Capacitor?.getPlatform?.() === 'android') {
                  document.documentElement.classList.add('cap-android');
                  // env(safe-area-inset-top)이 0인 Android 기기 대비:
                  // native bridge에서 실제 상태바 높이를 읽어 CSS 변수로 설정
                  try {
                    const h = window.AndroidBridge?.getStatusBarHeightDp?.();
                    if (h > 0) {
                      document.documentElement.style.setProperty('--cap-status-bar-height', h + 'px');
                    }
                  } catch (_) {}
                  // env(safe-area-inset-bottom)도 같은 이유로 0인 기기 대비
                  try {
                    const nb = window.AndroidBridge?.getNavigationBarHeightDp?.();
                    if (nb > 0) {
                      document.documentElement.style.setProperty('--cap-nav-bar-height', nb + 'px');
                    }
                  } catch (_) {}
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
        {/* Google Maps API는 APIProvider가 필요한 페이지에서만 로드 */}
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
              <NativeStatusBarSync />
              <NetworkGuard />
              <ServiceGuard />
              <AndroidBackHandler />
              <AndroidNotificationHandler />
              <ServiceWorkerUpdater />
              <div
                data-app-root
                className="flex flex-col min-h-screen w-full mx-auto max-w-4xl relative transition-colors duration-300 dark:bg-[#121212] dark:text-white bg-white text-itta-black"
              >
                {/* status bar 커버: position fixed + 인라인 zIndex로 스크롤과 무관하게 항상 가림 */}
                <StatusBarCover />
                {/* 레이아웃 흐름상 status bar 높이만큼 공간 확보 (iOS PWA용; native는 CSS로 숨김) */}
                <div
                  data-layout-spacer
                  style={{ height: 'env(safe-area-inset-top)', flexShrink: 0 }}
                />
                <Suspense fallback={null}>
                  <PWAInstallBanner />
                </Suspense>
                <ConditionalHeader />
                {children}
                <Suspense fallback={null}>
                  <BottomNavigation />
                </Suspense>
              </div>
            </ThemeProvider>
          </Providers>
        </AuthContext>
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID!} />
      </body>
    </html>
  );
}
