import RecordList from './_components/RecordList';
import WeekCalendar from './_components/WeekCalendar';
import StreakStats from './_components/StreakStats';
import HomePageSkeleton from './_components/HomePageSkeleton';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { formatDateISO } from '@/lib/date';
import { recordPreviewListOptions } from '@/lib/api/records';
import { userRecordPatternOptions } from '@/lib/api/profile';
import ErrorHandlingWrapper from '@/components/ErrorHandlingWrapper';
import ErrorFallback from '@/components/ErrorFallback';
import { redirect } from 'next/navigation';

interface HomePageProps {
  searchParams: Promise<{ date?: string }>;
}

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

export default async function HomePage({ searchParams }: HomePageProps) {
  const { date } = await searchParams;

  // 날짜가 없으면 오늘 날짜로 리다이렉트
  // if (!date) {
  //   redirect(`/?date=${formatDateISO()}`);
  // }

  const selectedDate = date || formatDateISO();

  const queryClient = new QueryClient();

  if (process.env.NEXT_PUBLIC_MOCK === 'true') {
    queryClient.setQueryData(
      recordPreviewListOptions(selectedDate).queryKey,
      [],
    );
    queryClient.setQueryData(userRecordPatternOptions().queryKey, {
      streak: 0,
      monthlyRecordingDays: 0,
    });
  } else {
    await Promise.all([
      queryClient.prefetchQuery(recordPreviewListOptions(selectedDate)),
      queryClient.prefetchQuery(userRecordPatternOptions()),
    ]);
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <WeekCalendar />
      {/* <WeekCalendarSkeleton /> */}
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ErrorHandlingWrapper
          fallbackComponent={ErrorFallback}
          suspenseFallback={<HomePageSkeleton />}
        >
          <StreakStats />
          <div className="flex-1 w-full overflow-y-auto scrollbar-hide px-5 space-y-6 pt-7 pb-bottom-nav transition-colors duration-300 dark:bg-[#121212] bg-[#F9F9F9]">
            <div className="w-full flex flex-col gap-6">
              <RecordList imageLayout="responsive" />
            </div>
          </div>
        </ErrorHandlingWrapper>
      </HydrationBoundary>
    </div>
  );
}
