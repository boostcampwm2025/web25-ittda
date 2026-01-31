import type { Metadata } from 'next';
import MonthRecords from '@/app/(post)/_components/MonthRecords';
import {
  getCachedGroupMonthlyRecordList,
  getCachedGroupDetail,
} from '@/lib/api/group';
import { createMockGroupMonthlyRecords } from '@/lib/mocks/mock';
import { MonthlyRecordList } from '@/lib/types/recordResponse';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { SingleResolveResponse } from '@/hooks/useMediaResolve';
import { get } from '@/lib/api/api';
import { randomBaseImage } from '@/lib/image';

interface GroupPageProps {
  params: Promise<{ groupId: string }>;
}

export async function generateMetadata({
  params,
}: GroupPageProps): Promise<Metadata> {
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
  } catch (error) {
    // 에러 발생 시 기본 메타데이터 반환
    return {
      title: '그룹 기록함 - 잇다',
      description: '함께 만드는 추억, 잇다',
    };
  }
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { groupId } = await params;
  const year = String(new Date().getFullYear());

  let monthlyRecords: MonthlyRecordList[];
  const queryClient = new QueryClient();

  if (process.env.NEXT_PUBLIC_MOCK === 'true') {
    monthlyRecords = createMockGroupMonthlyRecords();
  } else {
    monthlyRecords = await getCachedGroupMonthlyRecordList(groupId, year);

    // QueryClient에 원본 데이터를 저장 (select 함수가 클라이언트에서 변환)
    queryClient.setQueryData(
      ['group', groupId, 'records', 'month', year],
      monthlyRecords || [],
    );
  }

  return (
    <>
      {groupId && (
        <HydrationBoundary state={dehydrate(queryClient)}>
          {process.env.NEXT_PUBLIC_MOCK === 'true' ? (
            <MonthRecords
              groupId={groupId}
              monthRecords={monthlyRecords}
              cardRoute={`/group/${groupId}/month`}
            />
          ) : (
            <MonthRecords
              groupId={groupId}
              cardRoute={`/group/${groupId}/month`}
            />
          )}
        </HydrationBoundary>
      )}
    </>
  );
}
