import type { Metadata } from 'next';
import { getCachedGroupDetail } from '@/lib/api/group';
import { get } from '@/lib/api/api';
import { SingleResolveResponse } from '@/hooks/useMediaResolve';
import { randomBaseImage } from '@/lib/image';

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

    //url이 없고 로컬 경로나 URL이 아닐 때만 assetId로 solve 호출하기
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
      metadataBase:
        process.env.NODE_ENV == 'production'
          ? process.env.NEXT_PUBLIC_PRODUCTION_API_URL
          : 'http://localhost:3000',
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // 에러 발생 시 기본 메타데이터 반환
    return {
      title: '그룹 기록함 - 잇다',
      description: '함께 만드는 추억, 잇다',
    };
  }
}

export default function GroupLayout({ children }: GroupLayoutProps) {
  return <>{children}</>;
}
