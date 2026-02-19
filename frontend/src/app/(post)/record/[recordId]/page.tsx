import type { Metadata } from 'next';
import { getCachedRecordDetail } from '@/lib/api/records';
import RecordDetailContent from '../_components/RecordDetailContent';
import {
  ImageValue,
  TextValue,
} from '@/lib/types/record';
import { get } from '@/lib/api/api';
import { SingleResolveResponse } from '@/hooks/useMediaResolve';
import { randomBaseImage } from '@/lib/image';

interface RecordPageProps {
  params: Promise<{ recordId: string }>;
}

export async function generateMetadata({
  params,
}: RecordPageProps): Promise<Metadata> {
  const { recordId } = await params;

  try {
    const record = await getCachedRecordDetail(recordId);

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
    const response = await get<SingleResolveResponse>(
      `/api/media/${imageAssetId}/url`,
    );

    const imageSrc = isLocalPath
      ? imageAssetId
      : isAlreadyUrl
        ? imageAssetId
        : response.data?.url;

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
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: record.title,
          },
        ],
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

export default async function RecordPage({ params }: RecordPageProps) {
  const { recordId } = await params;

  return <RecordDetailContent recordId={recordId} />;
}
