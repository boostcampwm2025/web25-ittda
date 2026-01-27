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

interface HomePageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { date } = await searchParams;
  const selectedDate = date || formatDateISO();

  const queryClient = new QueryClient();
  let currentStreak = 0;
  let monthlyRecordCount = 0;

  if (process.env.NEXT_PUBLIC_MOCK !== 'true') {
    const [recordPreviews, streakData] = await Promise.all([
      getCachedRecordPreviewList(selectedDate),
      getCachedUserRecordStats(),
    ]);

    // QueryClient에 직접 넣어서 HydrationBoundary로 클라이언트에 전달
    queryClient.setQueryData(
      ['records', 'preview', selectedDate],
      recordPreviews,
    );

    currentStreak = streakData.streak;
    monthlyRecordCount = streakData.monthlyRecordingDays;
  }
  return (
    <>
      <WeekCalendar />
      <div className="border-t-[0.5px] border-gray-100 dark:border-gray-800 flex w-full p-3 transition-colors duration-300 bg-transparent">
        <div className="flex w-full justify-between gap-3 items-center border-r px-3 pr-5">
          <span className="text-[12px]">오늘 작성</span>
          <div className="flex justify-start items-center gap-1.5">
            <span className="text-itta-point font-semibold">
              {currentStreak}
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
              {monthlyRecordCount}
            </span>
            <span className="text-[12px] font-medium text-gray-400">일</span>
          </div>
        </div>
      </div>
      <div className="flex-1 w-full p-5 space-y-6 pb-30 pt-7 transition-colors duration-300 dark:bg-[#121212] bg-[#F9F9F9]">
        <div className="w-full flex flex-col gap-6">
          <HydrationBoundary state={dehydrate(queryClient)}>
            <RecordList />
          </HydrationBoundary>
        </div>
      </div>
    </>
  );
}
