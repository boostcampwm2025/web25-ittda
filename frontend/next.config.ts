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
        source: '/api/posts/:path*',
        destination: `${backendHost}/posts/:path*`,
      },
      {
        source: '/api/kopis/:path*',
        destination: 'http://www.kopis.or.kr/openApi/restful/:path*',
      },
      {
        source: '/api/:path*',
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
      //  KOPIS 도메인 (http 허용 추가)
      {
        protocol: 'http',
        hostname: 'www.kopis.or.kr',
      },
      {
        protocol: 'https',
        hostname: 'www.kopis.or.kr',
      },
    ],
  },
};

export default nextConfig;
