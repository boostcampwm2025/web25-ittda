import RecordList from './_components/RecordList';
import WeekCalendar from './_components/WeekCalendar';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { recordPreviewListOptions } from '@/lib/api/records';
import { formatDateISO } from '@/lib/date';

interface HomePageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { date } = await searchParams;
  const selectedDate = date || formatDateISO();

  const queryClient = new QueryClient();

  if (process.env.NEXT_PUBLIC_MOCK !== 'true') {
    await queryClient.prefetchQuery(recordPreviewListOptions(selectedDate));
  }
  return (
    <>
      <WeekCalendar />
      <div className="border-t-[0.5px] border-gray-100 dark:border-gray-800 flex w-full p-3 transition-colors duration-300 bg-transparent">
        <div className="flex w-full justify-between gap-3 items-center border-r px-3 pr-5">
          <span className="text-[12px]">오늘 작성</span>
          <div className="flex justify-start items-center gap-1.5">
            <span className="text-itta-point font-semibold">1</span>
            <span className="text-[12px] font-medium text-gray-400">
              일째 작성 중
            </span>
          </div>
        </div>
        <div className="flex w-full justify-between gap-3 items-center px-3 pl-5">
          <span className="text-[12px]">이번달 기록</span>
          <div className="flex justify-start items-center gap-1.5 ">
            <span className="text-itta-point font-semibold">10</span>
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
