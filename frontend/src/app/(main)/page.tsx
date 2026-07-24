import WeekCalendar from './_components/WeekCalendar';
import HomeData from './_components/HomeData';
import HomePageSkeleton from './_components/HomePageSkeleton';
import { Suspense } from 'react';
import AnnouncementModal from '@/components/AnnouncementModal';
import WeekCalendarSkeleton from './_components/WeekCalendarSkeleton';
import Coachmark from '@/components/Coachmark';
import { HOME_COACHMARK_STEPS } from './_components/homeCoachmarkSteps';

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
      {/* AnnouncementModal은 서버에서 공지 표시 여부를 비동기로 판단하는 동안
          아무것도 렌더링하지 않으면(fallback=null) 코치마크가 "공지 없음"으로
          착각하고 먼저 떴다가, 판단이 끝나며 공지가 나타나면 밀려서 깜빡인다.
          PWA 배너와 같은 방식으로 판단 중임을 알리는 마커를 남겨둔다. */}
      <Suspense
        fallback={
          <div data-announcement-pending className="hidden" aria-hidden />
        }
      >
        <AnnouncementModal />
      </Suspense>
      <Coachmark flowKey="home" steps={HOME_COACHMARK_STEPS} />
      <Suspense fallback={<WeekCalendarSkeleton />}>
        <WeekCalendar />
      </Suspense>
      <div className="flex-1 flex flex-col min-h-0">
        <Suspense fallback={<HomePageSkeleton />}>
          <HomeData />
        </Suspense>
      </div>
    </div>
  );
}
