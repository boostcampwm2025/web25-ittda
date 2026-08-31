import type { Metadata } from 'next';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { getCachedRecordDetail, recordDetailOptions } from '@/lib/api/records';
import RecordDetailContent from '../_components/RecordDetailContent';
import { ImageValue, TextValue } from '@/lib/types/record';
import { get } from '@/lib/api/api';
import { SingleResolveResponse } from '@/hooks/useMediaResolve';
import { randomBaseImage } from '@/lib/image';

interface RecordPageProps {
  params: Promise<{ recordId: string }>;
  searchParams: Promise<{ groupId?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: RecordPageProps): Promise<Metadata> {
  const { recordId } = await params;
  const { groupId } = await searchParams;

  try {
    // groupId까지 동일한 인자로 호출해야 아래 RecordPage 본문의 React
    // cache()가 같은 호출로 인식해서 중복 요청 없이 재사용된다.
    const record = await getCachedRecordDetail(recordId, groupId);

    // 첫 번째 텍스트 블록에서 설명 추출 (최대 150자)
    const textBlock = record.blocks.find((block) => block.type === 'TEXT');
    const description = textBlock
      ? ((textBlock.value as TextValue).text || '').slice(0, 150)
      : '나의 소중한 기록';

    // 첫 번째 이미지 블록에서 이미지 추출
    const imageBlock = record.blocks.find((block) => block.type === 'IMAGE');
    const imageAssetId = imageBlock
      ? (imageBlock.value as ImageValue).mediaIds?.[0]
      : randomBaseImage(record.id);

    const isLocalPath = imageAssetId?.startsWith('/');
    const isAlreadyUrl =
      imageAssetId?.startsWith('http://') ||
      imageAssetId?.startsWith('https://');

    //url이 없고 로컬 경로나 URL이 아닐 때만 assetId로 solve 호출하기
    const response =
      !isLocalPath && !isAlreadyUrl && imageAssetId
        ? await get<SingleResolveResponse>(`/api/media/${imageAssetId}/url`)
        : null;

    const imageSrc = isLocalPath
      ? imageAssetId
      : isAlreadyUrl
        ? imageAssetId
        : response?.data?.url;

    const imageUrl = imageSrc
      ? imageSrc
      : `${process.env.NEXT_PUBLIC_CLIENT_URL}/thumbnail.png`;

    return {
      title: `${record.title} - 잇다`,
      description,
      openGraph: {
        title: `${record.title} - 잇다`,
        description,
        type: 'article',
        url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/record/${recordId}`,
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
  } catch (error) {
    // 에러 발생 시 기본 메타데이터 반환
    return {
      title: '기록 상세 - 잇다',
      description: '나의 소중한 기록',
    };
  }
}

export default async function RecordPage({
  params,
  searchParams,
}: RecordPageProps) {
  const { recordId } = await params;
  const { groupId } = await searchParams;

  const queryClient = new QueryClient();
  try {
    // generateMetadata에서 getCachedRecordDetail을 이미 호출했다면 React cache()로 중복 요청 없이 재사용됨.
    // setQueryData로 서버 데이터를 클라이언트 QueryClient에 이식해 useSuspenseQuery가 바로 캐시를 찾게 함.
    const data = await getCachedRecordDetail(recordId, groupId);
    queryClient.setQueryData(
      recordDetailOptions(recordId, groupId).queryKey,
      data,
    );
  } catch {
    // 에러는 RecordDetail 클라이언트 컴포넌트의 ErrorBoundary에서 처리
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RecordDetailContent recordId={recordId} groupId={groupId} />
    </HydrationBoundary>
  );
}
