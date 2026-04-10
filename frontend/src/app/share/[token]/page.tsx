import type { Metadata } from 'next';
import { get } from '@/lib/api/api';
import { Block, ImageValue, TextValue } from '@/lib/types/record';
import { randomBaseImage } from '@/lib/image';
import { SingleResolveResponse } from '@/hooks/useMediaResolve';
import SharedRecordContent from './SharedRecordContent';

interface SharedPostResponse {
  id: string;
  title: string;
  blocks: Block[];
  resolvedMediaUrls: Record<string, string>;
}

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({
  params,
}: SharePageProps): Promise<Metadata> {
  const { token } = await params;

  try {
    const res = await get<SharedPostResponse>(
      `/api/posts/shared/${token}`,
      undefined,
      { skipAuth: true },
    );

    if (!res.success || !res.data) throw new Error('Not found');
    const record = res.data;

    const textBlock = record.blocks.find((block) => block.type === 'TEXT');
    const description = textBlock
      ? ((textBlock.value as TextValue).text || '').slice(0, 150)
      : '나의 소중한 기록';

    const imageBlock = record.blocks.find((block) => block.type === 'IMAGE');
    const imageAssetId = imageBlock
      ? (imageBlock.value as ImageValue).mediaIds?.[0]
      : randomBaseImage(record.id);

    const isLocalPath = imageAssetId?.startsWith('/');
    const isAlreadyUrl =
      imageAssetId?.startsWith('http://') ||
      imageAssetId?.startsWith('https://');

    const resolvedUrl = imageAssetId
      ? record.resolvedMediaUrls?.[imageAssetId]
      : undefined;

    const mediaResponse =
      !isLocalPath && !isAlreadyUrl && !resolvedUrl && imageAssetId
        ? await get<SingleResolveResponse>(`/api/media/${imageAssetId}/url`)
        : null;

    const imageSrc = isLocalPath
      ? imageAssetId
      : isAlreadyUrl
        ? imageAssetId
        : (resolvedUrl ?? mediaResponse?.data?.url);

    const imageUrl = imageSrc
      ? imageSrc
      : `${process.env.NEXT_PUBLIC_CLIENT_URL}/thumbnail.png`;

    const shareUrl = `${process.env.NEXT_PUBLIC_CLIENT_URL}/share/${token}`;

    return {
      title: `${record.title} - 잇다`,
      description,
      openGraph: {
        title: `${record.title} - 잇다`,
        description,
        type: 'article',
        url: shareUrl,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: record.title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${record.title} - 잇다`,
        description,
        images: [imageUrl],
      },
    };
  } catch {
    return {
      title: '공유된 기록 - 잇다',
      description: '나의 소중한 기록',
    };
  }
}

export default function SharedRecordPage() {
  return <SharedRecordContent />;
}
