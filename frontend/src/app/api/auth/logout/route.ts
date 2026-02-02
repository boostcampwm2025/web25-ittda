import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export async function POST() {
  const session = await auth();

  if (session?.accessToken) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });
    } catch (error) {
      // 백엔드 로그아웃 통신 실패는 경고로 기록 (세션은 클라이언트에서 삭제되므로)
      Sentry.captureException(error, {
        level: 'warning',
        tags: {
          context: 'auth',
          operation: 'backend-logout',
        },
      });
      console.error('백엔드 로그아웃 통신 실패', error);
    }
  }
  return NextResponse.json({ success: true, data: {}, error: null });
}
