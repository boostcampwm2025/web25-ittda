import { NextResponse } from 'next/server';
import { auth } from '@/auth';

// 인증 없이 접근 가능한 경로
const PUBLIC_PATHS = ['/login', '/oauth/callback', '/invite'];

export default auth((req) => {
  const { nextUrl, auth: session, cookies } = req;

  const isSocialLoggedIn = !!session;
  const isGuestLoggedIn = !!cookies.get('x-guest-session-id');
  const isLoggedIn = isSocialLoggedIn || isGuestLoggedIn; // 세션이 있으면 true

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
    return NextResponse.next();
  }

  // 초대 링크 처리
  if (nextUrl.pathname.startsWith('/invite') && hasInviteCode) {
    return NextResponse.next();
  }

  // 로그인 안 했고, 공개 경로도 아니고, 초대 코드도 없으면 로그인으로
  if (!isLoggedIn && !isPublicPath && !hasInviteCode) {
    const loginUrl = new URL('/login', nextUrl);
    // 원래 가려던 주소를 저장해두면 로그인 후 되돌려보낼 때 유용
    loginUrl.searchParams.set('callback', nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // 정적 파일, API, manifest 제외한 모든 경로
    '/((?!_next/static|_next/image|favicon.ico|mockServiceWorker\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api|manifest\\.webmanifest).*)',
  ],
};
