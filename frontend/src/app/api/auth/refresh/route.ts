import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function POST() {
  // auth()는 내부적으로 JWT callback을 실행하며,
  // accessTokenExpires가 만료된 경우 refreshServerAccessToken을 호출해 갱신합니다.
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json(
      { success: false, data: null, error: 'No valid session' },
      { status: 401 },
    );
  }

  const res = NextResponse.json({ success: true, data: {}, error: null });
  res.headers.set('Authorization', `Bearer ${session.accessToken}`);
  return res;
}
