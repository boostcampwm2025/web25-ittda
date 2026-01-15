import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 로그인 페이지 접근 시
  if (pathname === '/login') {
    // HttpOnly 쿠키에서 refreshToken 확인
    const refreshToken = request.cookies.get('refreshToken');

    // 로그인한 유저면 홈으로 리다이렉트
    if (refreshToken?.value) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login'],
};
