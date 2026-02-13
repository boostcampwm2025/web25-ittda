import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: 'itta-org',
    lang: 'ko',
    categories: ['lifestyle', 'travel', 'productivity', 'social'],
    name: '잇다-',
    short_name: '잇다-',
    description: '기억과 맥락을 이어주는 기록 서비스',
    start_url: '/',
    display: 'standalone',
    background_color: '#10b981',
    theme_color: '#10b981',
    screenshots: [
      // {
      //   src: '/screenshots/mobile.png',
      //   sizes: '1080x1920',
      //   type: 'image/png',
      //   form_factor: 'narrow',
      //   label: '사진 한 장으로 간편하게 시작하는 추억 기록',
      // },
      // {
      //   src: '/screenshots/desktop.png',
      //   sizes: '1920x1080',
      //   type: 'image/png',
      //   form_factor: 'wide',
      //   label: '우리만의 소중한 기억을 한눈에 관리하는 대시보드',
      // },
    ],
    shortcuts: [
      // {
      //   name: '새 기록 남기기',
      //   short_name: '기록하기',
      //   description: '사진 한 장으로 오늘의 추억을 바로 기록합니다.',
      //   url: '/add',
      //   icons: [{ src: '/shortcut-add.png', sizes: '192x192' }],
      // },
      // {
      //   name: '우리 그룹 소식',
      //   short_name: '그룹',
      //   description: '공동 작업 중인 기록을 확인합니다.',
      //   url: '/groups',
      //   icons: [{ src: '/shortcut-group.png', sizes: '192x192' }],
      // },
      // {
      //   name: '추억 지도 보기',
      //   short_name: '지도',
      //   description: '지도 위에서 흩어진 기억을 확인합니다.',
      //   url: '/map',
      //   icons: [{ src: '/shortcut-map.png', sizes: '192x192' }],
      // },
    ],
    icons: [
      {
        src: '/web-app-icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/web-app-icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/web-app-icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
