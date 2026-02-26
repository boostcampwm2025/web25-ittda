/** @type {import('@lhci/cli').LighthouseConfig} */
module.exports = {
  ci: {
    collect: {
      // 측정 전 게스트 로그인 자동화
      puppeteerScript: './frontend/lighthouse.puppeteer.js',
      url: [
        // 'http://localhost:3000/login', // 로그인 (public)
        'http://localhost:3000/', // 홈
        'http://localhost:3000/profile', // 프로필
        'http://localhost:3000/search', // 검색
        'http://localhost:3000/my', // 내 기록
        'http://localhost:3000/add', // 기록 추가
        'http://localhost:3000/shared', // 함께 기록함
        'http://localhost:3000/map', // 지도
      ],
      numberOfRuns: 3,
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
