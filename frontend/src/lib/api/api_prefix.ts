// 환경에 따라 백엔드 api prefix 분기 (주의: 현재 v1 포함)

// 서버 컴포넌트에서 사용하는 API 프리픽스
export const serverComponentApiPrefix =
  // 클라우드 FE or 로컬 FE에서 nest 호출
  process.env.NODE_ENV === 'production'
    ? 'http://backend:4000/api/v1' // 도커 네트워크 내 백엔드 서비스 이름 기준 URL
    : 'http://localhost:4000/api/v1';

// 클라이언트 컴포넌트('use client')에서 사용하는 nest API 프리픽스
export const clientComponentNestApiPrefix =
  // 브라우저에서 클라우드 or 로컬 nest 호출
  process.env.NODE_ENV === 'production'
    ? 'http://211.188.48.38/api/v1' // https 적용 전, 나중에 도메인 변경 필요, nginx /api reverse proxy 고려
    : 'http://localhost:4000/api/v1';

// 클라이언트 컴포넌트('use client')에서 사용하는 next API 프리픽스
export const clientComponentNextApiPrefix =
  // 브라우저에서 클라우드 or 로컬 next server호출
  process.env.NODE_ENV === 'production'
    ? 'http://211.188.48.38' // https 적용 전, 나중에 도메인 변경 필요
    : 'http://localhost:3000';
