import type { Metadata } from 'next';
import RecordMapClient from './_components/RecordMapClient';

export const metadata: Metadata = {
  title: '지도 - 잇다',
  description: '지도에서 나의 기록을 확인하세요',
  openGraph: {
    title: '지도 - 잇다',
    description: '지도에서 나의 기록을 확인하세요',
    type: 'website',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/thumbnail.png`,
        width: 1200,
        height: 630,
        alt: '잇다 - 지도',
      },
    ],
  },
};

export default function RecordMapPage() {
  return <RecordMapClient />;
}
