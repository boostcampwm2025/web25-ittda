import type { Metadata } from 'next';
import { getCachedGroupDetail, getCachedGroupMyProfile } from '@/lib/api/group';
import { get } from '@/lib/api/api';
import { SingleResolveResponse } from '@/hooks/useMediaResolve';
import { randomBaseImage } from '@/lib/image';
import { redirect, notFound } from 'next/navigation';

interface GroupLayoutProps {
  children: React.ReactNode;
  params: Promise<{ groupId: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ groupId: string }>;
}): Promise<Metadata> {
  const { groupId } = await params;

  try {
    const groupData = await getCachedGroupDetail(groupId);
    const groupName = groupData.group.name;
    const coverAssetId =
      groupData.group.cover?.assetId ||
      randomBaseImage(groupData.group.groupId);

    const isLocalPath = coverAssetId?.startsWith('/');
    const isAlreadyUrl =
      coverAssetId?.startsWith('http://') ||
      coverAssetId?.startsWith('https://');

    const response = await get<SingleResolveResponse>(
      `/api/media/${coverAssetId}/url`,
    );

    const imageSrc = isLocalPath
      ? coverAssetId
      : isAlreadyUrl
        ? coverAssetId
        : response.data?.url;

    const imageUrl = imageSrc
      ? imageSrc
      : `${process.env.NEXT_PUBLIC_CLIENT_URL}/thumbnail.png`;

    return {
      title: `${groupName} - 잇다`,
      description: `${groupName}의 함께 만드는 추억`,
      openGraph: {
        title: `${groupName} - 잇다`,
        description: `${groupName}의 함께 만드는 추억`,
        type: 'website',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: groupName,
          },
        ],
      },
    };
  } catch {
    return {
      title: '그룹 기록함 - 잇다',
      description: '함께 만드는 추억, 잇다',
    };
  }
}

export default async function GroupLayout({
  children,
  params,
}: GroupLayoutProps) {
  const { groupId } = await params;

  try {
    await getCachedGroupMyProfile(groupId);
  } catch (error: unknown) {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? (error as { code: string }).code
        : undefined;

    if (code === 'NOT_FOUND') notFound();
    redirect('/shared');
  }

  return <>{children}</>;
}
