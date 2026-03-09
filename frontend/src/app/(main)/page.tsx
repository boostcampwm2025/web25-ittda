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

function WeekCalendarSkeleton() {
  return (
    <>
      <div className="flex flex-col gap-2 px-2 py-2 sm:px-6 sm:py-4 animate-pulse self-start">
        <div className="mb-2 h-4 sm:h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="mx-2 mb-2 sm:mx-6 h-13.5 sm:h-14.5 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
    </>
  );
}

export default function HomePage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Suspense fallback={<WeekCalendarSkeleton />}>
        <WeekCalendar />
      </Suspense>
      <Suspense fallback={<HomePageSkeleton />}>
        <HomeData />
      </Suspense>
    </div>
  );
}
