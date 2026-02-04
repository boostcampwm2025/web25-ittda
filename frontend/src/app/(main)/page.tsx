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
    title: '잇다-개인의 기록을 넘어, 함께 만드는 추억',
    description: '친구들과 쉽게 공유하고 소통할 수 있는 새로운 방법, 잇다-',
    openGraph: {
      title: '개인의 기록을 넘어, 함께 만드는 추억',
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
    <>
      <WeekCalendar />
      <div className="border-t-[0.5px] border-gray-100 dark:border-gray-800 flex w-full p-3 transition-colors duration-300 bg-transparent">
        <div className="flex w-full justify-between gap-3 items-center border-r px-3 pr-5">
          <span className="text-[12px]">오늘 작성</span>
          <div className="flex justify-start items-center gap-1.5">
            <span className="text-itta-point font-semibold">
              {streakData.streak}
            </span>
            <span className="text-[12px] font-medium text-gray-400">
              일째 작성 중
            </span>
          </div>
        </div>
        <div className="flex w-full justify-between gap-3 items-center px-3 pl-5">
          <span className="text-[12px]">이번달 기록</span>
          <div className="flex justify-start items-center gap-1.5 ">
            <span className="text-itta-point font-semibold">
              {streakData.monthlyRecordingDays}
            </span>
            <span className="text-[12px] font-medium text-gray-400">일</span>
          </div>
        </div>
      </div>
      <div className="flex-1 w-full p-5 space-y-6 pb-30 pt-7 transition-colors duration-300 dark:bg-[#121212] bg-[#F9F9F9]">
        <div className="w-full flex flex-col gap-6">
          <HydrationBoundary state={dehydrate(queryClient)}>
            <RecordList initialPreviews={recordPreviews} />
          </HydrationBoundary>
        </div>
      </div>
    </>
  );
}
