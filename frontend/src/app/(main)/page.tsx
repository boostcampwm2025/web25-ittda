import WeekCalendar from './_components/WeekCalendar';
import HomeData from './_components/HomeData';
import HomePageSkeleton, {
  StreakStatsSkeleton,
} from './_components/HomePageSkeleton';
import { Suspense } from 'react';
import AnnouncementModal from '@/components/AnnouncementModal';
import WeekCalendarSkeleton from './_components/WeekCalendarSkeleton';
import Coachmark from '@/components/Coachmark';
import { HOME_COACHMARK_STEPS } from './_components/homeCoachmarkSteps';
import { RecordTimelineProvider } from './_components/RecordTimelineProvider';
import { formatDateISO } from '@/lib/date';
import ScrollToTopButton from '@/components/ScrollToTopButton';
import HomeCalendarStreakSticky from './_components/HomeCalendarStreakSticky';
import StreakStats from './_components/StreakStats';

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
    <div className="flex flex-col">
      <Suspense
        fallback={
          <div data-announcement-pending className="hidden" aria-hidden />
        }
      >
        <AnnouncementModal />
      </Suspense>
      <Coachmark flowKey="home" steps={HOME_COACHMARK_STEPS} />
      <RecordTimelineProvider initialDate={formatDateISO()}>
        <HomeCalendarStreakSticky>
          <Suspense fallback={<WeekCalendarSkeleton />}>
            <WeekCalendar sticky={false} />
          </Suspense>
          <Suspense fallback={<StreakStatsSkeleton />}>
            <StreakStats />
          </Suspense>
        </HomeCalendarStreakSticky>
        <div className="flex-1 flex flex-col min-h-0">
          <Suspense fallback={<HomePageSkeleton />}>
            <HomeData />
          </Suspense>
        </div>
      </RecordTimelineProvider>
      <ScrollToTopButton />
    </div>
  );
}
