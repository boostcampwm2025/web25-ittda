import { NextResponse } from 'next/server';
import { auth } from '@/auth';

// 인증 없이 접근 가능한 경로
const PUBLIC_PATHS = [
  '/login',
  '/oauth/callback',
  '/invite',
  '/monitoring',
  '/share',
  '/admin',
];

export default auth((req) => {
  const { nextUrl, auth: session, cookies } = req;

  // 서버 컴포넌트에서 현재 경로를 읽을 수 있도록 요청 헤더에 pathname 추가
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', nextUrl.pathname);
  const next = () =>
    NextResponse.next({ request: { headers: requestHeaders } });

  const isSocialLoggedIn = !!session?.accessToken && !session.error;
  const isGuestLoggedIn =
    !!cookies.get('x-guest-session-id') ||
    !!cookies.get('x-guest-access-token');
  const isLoggedIn = isSocialLoggedIn || isGuestLoggedIn; // 세션이 있으면 tru

  const isPublicPath = PUBLIC_PATHS.some((path) =>
    nextUrl.pathname.startsWith(path),
  );
  // 초대 코드는 URL 파라미터에서 직접 확인
  const hasInviteCode = !!nextUrl.searchParams.get('inviteCode');

  // 로그인 페이지 처리 (로그인된 유저는 홈으로, 아니면 접근 허용)
  if (nextUrl.pathname === '/login') {
    if (isSocialLoggedIn) {
      return NextResponse.redirect(new URL('/', nextUrl));
    }
    return next();
  }

  // 초대 링크 처리
  if (nextUrl.pathname.startsWith('/invite') && hasInviteCode) {
    return next();
  }

  // 로그인 안 했고, 공개 경로도 아니고, 초대 코드도 없으면 로그인으로
  if (!isLoggedIn && !isPublicPath && !hasInviteCode) {
    const loginUrl = new URL('/login', nextUrl);
    // 원래 가려던 주소를 저장해두면 로그인 후 되돌려보낼 때 유용
    loginUrl.searchParams.set('callback', nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return next();
});

export const config = {
  matcher: [
    // 정적 파일, API, manifest 제외한 모든 경로
    '/((?!_next/static|_next/image|monitoring|favicon.ico|mockServiceWorker\\.js|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|html)$|api|manifest\\.webmanifest|sitemap\\.xml|robots\\.txt).*)',
  ],
};
