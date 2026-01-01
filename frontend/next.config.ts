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
];

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/posts/:path*',
        destination: 'http://localhost:4000/posts/:path*',
      },
    ];
  },

  images: {
    remotePatterns: imageDomains.map((host) => ({
      protocol: 'https',
      hostname: host,
    })),
  },
};

export default nextConfig;
