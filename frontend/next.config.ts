import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

// TODO: 나중에는 이미지 호스팅용 CDN 도메인으로 변경 필요
const imageDomains = [
  'picsum.photos',
  'catnews.net',
  'cdn.ynenews.kr',
  'mblogthumb-phinf.pstatic.net',
  'i0.wp.com',
  'velog.velcdn.com',
  'biz.chosun.com',
  'images.unsplash.com',
  'api.dicebear.com',
  'image.tmdb.org',
];

// 환경에 따라 백엔드 주소 분기
const backendHost =
  process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_PRODUCTION_API_URL
    : 'http://localhost:4000';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/tmdb/:path*',
        destination: 'https://api.themoviedb.org/3/:path*',
      },
      {
        source: '/api/kopis/:path*',
        destination: 'http://www.kopis.or.kr/openApi/restful/:path*',
      },
      {
        source: '/api/auth/guest',
        destination: `${backendHost}/v1/auth/guest`,
      },
      {
        source: '/api/:path((?!auth).*)', // 'auth'를 제외한 모든 /api 요청만 백엔드로
        destination: `${backendHost}/v1/:path*`,
      },
    ];
  },

  images: {
    remotePatterns: [
      // 기존 도메인들 (https 전용)
      ...imageDomains.map((host) => ({
        protocol: 'https' as const,
        hostname: host,
      })),
      {
        protocol: 'https',
        hostname: 'api.themoviedb.org',
      },
      //  KOPIS 도메인 (http 허용 추가)
      {
        protocol: 'http',
        hostname: 'www.kopis.or.kr',
      },
      {
        protocol: 'https',
        hostname: 'www.kopis.or.kr',
      },
      // 로컬 개발 이미지 조회용
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'kr.object.ncloudstorage.com',
        pathname: '/**',
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "ee4bfb86ef7d",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});
