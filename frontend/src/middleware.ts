import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 인증 없이 접근 가능한 경로
const PUBLIC_PATHS = ['/login', '/oauth/callback'];

// 인증이 필요한지 확인
function isAuthenticated(request: NextRequest): boolean {
  // 소셜 로그인: refreshToken 쿠키 확인
  const refreshToken = request.cookies.get('refreshToken');
  if (refreshToken?.value) return true;

  // 게스트 로그인: x-guest-session-id 쿠키 확인
  const guestSessionId = request.cookies.get('x-guest-session-id');
  if (guestSessionId?.value) return false;

  return false;
}

// 초대 코드가 있는지 확인
function hasInviteCode(request: NextRequest): boolean {
  const inviteCode = request.nextUrl.searchParams.get('inviteCode');
  return !!inviteCode;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const isLoggedIn = isAuthenticated(request);
  const isInvited = hasInviteCode(request);

  // 로그인 페이지 접근 시 이미 로그인한 유저면 홈으로
  if (pathname === '/login' && isLoggedIn) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 로그인 안 했고 초대 코드도 없으면 로그인 페이지로
  if (!isPublicPath && !isLoggedIn && !isInvited) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // 정적 파일, API, manifest 제외한 모든 경로
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api|manifest\\.webmanifest).*)',
  ],
};
