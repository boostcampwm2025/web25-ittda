import { auth } from '@/auth';
import { NextResponse } from 'next/server';

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
      console.error('백엔드 로그아웃 통신 실패', error);
    }
  }
  return NextResponse.json({ success: true, data: {}, error: null });
}
