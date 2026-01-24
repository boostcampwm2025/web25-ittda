import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function POST() {
  const session = await auth();

  if (!session?.refreshToken) {
    return NextResponse.json(
      { success: false, data: null, error: 'No refresh token' },
      { status: 401 },
    );
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/auth/refresh`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `refreshToken=${session.refreshToken}`,
        },
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { success: false, data: null, error: 'Refresh failed' },
        { status: 401 },
      );
    }

    const authHeader = response.headers.get('Authorization');
    const res = NextResponse.json({ success: true, data: null, error: null });

    if (authHeader) {
      res.headers.set('Authorization', authHeader);
    }

    // 백엔드에서 새로 발급한 refreshToken 쿠키를 클라이언트로 전달
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      res.headers.set('set-cookie', setCookie);
    }

    return res;
  } catch {
    return NextResponse.json(
      { success: false, data: null, error: 'Refresh request failed' },
      { status: 500 },
    );
  }
}
