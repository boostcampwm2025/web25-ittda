import WeekCalendar from './_components/WeekCalendar';
import HomeData from './_components/HomeData';
import HomePageSkeleton from './_components/HomePageSkeleton';
import { Suspense } from 'react';

export async function generateMetadata() {
  return {
    title: '잇다-',
    description: '친구들과 쉽게 공유하고 소통할 수 있는 새로운 방법, 잇다-',
    openGraph: {
      title: '잇다-',
      description: '친구들과 쉽게 공유하고 소통할 수 있는 새로운 방법, 잇다-',
      type: 'website',
      images: [
        {
          url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/thumbnail.png`,
          width: 1200,
          height: 630,
          alt: '잇다- 서비스 설명',
        },
      ],
    },
  };
}

export default function HomePage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <WeekCalendar />
      <Suspense fallback={<HomePageSkeleton />}>
        <HomeData />
      </Suspense>
    </div>
  );
}
