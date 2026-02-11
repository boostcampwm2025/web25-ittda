import RecordList from './_components/RecordList';
import WeekCalendar from './_components/WeekCalendar';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { getCachedRecordPreviewList } from '@/lib/api/records';
import { getCachedUserRecordStats } from '@/lib/api/profile';
import { formatDateISO } from '@/lib/date';
import { RecordPreview } from '@/lib/types/recordResponse';
import { RecordPatternResponse } from '@/lib/types/profileResponse';

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
  const selectedDate = date || formatDateISO();

  const queryClient = new QueryClient();
  let streakData: RecordPatternResponse = {
    streak: 0,
    monthlyRecordingDays: 0,
  };
  let recordPreviews: RecordPreview[];

  if (process.env.NEXT_PUBLIC_MOCK !== 'true') {
    [recordPreviews, streakData] = await Promise.all([
      getCachedRecordPreviewList(selectedDate),
      getCachedUserRecordStats(),
    ]);

    // QueryClient에 직접 넣어서 HydrationBoundary로 클라이언트에 전달
    // recordPreviewListOptions의 queryKey와 일치시켜야 함
    queryClient.setQueryData(
      ['records', 'preview', selectedDate, 'personal'],
      recordPreviews,
    );
  } else {
    recordPreviews = [];
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <WeekCalendar />
      <div className="border-t-[0.5px] border-gray-100 dark:border-gray-800 flex w-full p-2 sm:p-3 transition-colors duration-300 bg-transparent">
        <div className="flex w-full justify-between gap-1.5 sm:gap-3 items-center border-r px-2 sm:px-3 pr-3 sm:pr-5">
          <span className="text-[11px] sm:text-[12px] whitespace-nowrap">
            오늘 작성
          </span>
          <div className="flex justify-start items-center gap-1 sm:gap-1.5">
            <span className="text-itta-point font-semibold text-sm sm:text-base">
              {streakData.streak}
            </span>
            <span className="text-[11px] sm:text-[12px] font-medium text-gray-400 whitespace-nowrap">
              일째 작성 중
            </span>
          </div>
        </div>
        <div className="flex w-full justify-between gap-1.5 sm:gap-3 items-center px-2 sm:px-3 pl-3 sm:pl-5">
          <span className="text-[11px] sm:text-[12px] whitespace-nowrap">
            이번달 기록
          </span>
          <div className="flex justify-start items-center gap-1 sm:gap-1.5">
            <span className="text-itta-point font-semibold text-sm sm:text-base">
              {streakData.monthlyRecordingDays}
            </span>
            <span className="text-[11px] sm:text-[12px] font-medium text-gray-400 whitespace-nowrap">
              일
            </span>
          </div>
        </div>
      </div>
      <div className="flex-1 w-full overflow-y-auto scrollbar-hide px-5 space-y-6 pt-7 pb-bottom-nav transition-colors duration-300 dark:bg-[#121212] bg-[#F9F9F9]">
        <div className="w-full flex flex-col gap-6">
          <HydrationBoundary state={dehydrate(queryClient)}>
            <RecordList
              initialPreviews={recordPreviews}
              imageLayout="responsive"
            />
          </HydrationBoundary>
        </div>
      </div>
    </div>
  );
}
