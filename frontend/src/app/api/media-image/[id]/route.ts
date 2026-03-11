import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import sharp from 'sharp';

const backendUrl =
  process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_PRODUCTION_API_URL
    : 'http://localhost:4000';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const session = await auth();
  if (!session?.accessToken) {
    return new NextResponse(null, { status: 401 });
  }

  // 백엔드에서 presigned URL 가져오기
  const urlRes = await fetch(`${backendUrl}/v1/media/${id}/url`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });

  if (!urlRes.ok) {
    return new NextResponse(null, { status: urlRes.status });
  }

  const body = await urlRes.json();
  const presignedUrl: string | undefined = body?.data?.url;

  if (!presignedUrl) {
    return new NextResponse(null, { status: 404 });
  }

  // presigned URL에서 원본 이미지 가져오기
  const imageRes = await fetch(presignedUrl);
  if (!imageRes.ok) {
    return new NextResponse(null, { status: imageRes.status });
  }

  const originalBuffer = Buffer.from(await imageRes.arrayBuffer());

  // WebP로 변환
  const webpBuffer = await sharp(originalBuffer).webp({ quality: 85 }).toBuffer();

  return new NextResponse(new Uint8Array(webpBuffer), {
    headers: {
      'Content-Type': 'image/webp',
      // assetId는 불변(새 파일 = 새 UUID)이므로 1년 캐시
      'Cache-Control': 'private, max-age=31536000, immutable',
    },
  });
}
