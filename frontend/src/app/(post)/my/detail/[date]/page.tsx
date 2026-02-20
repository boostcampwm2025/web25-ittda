import DailyDetailRecords from '../../../../../components/DailyDetailRecords';
import DailyDetailFloatingActions from '@/app/(post)/_components/DailyDetailFloatingActions';
import Back from '@/components/Back';
import { getCachedRecordPreviewList } from '@/lib/api/records';
import { createMockRecordPreviews } from '@/lib/mocks/mock';
import { RecordPreview } from '@/lib/types/recordResponse';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';

interface MyMonthlyDetailPageProps {
  params: Promise<{ date: string }>;
}

export default async function MyDateDetailPage({
  params,
}: MyMonthlyDetailPageProps) {
  const { date } = await params;
  const queryClient = new QueryClient();

  let records: RecordPreview[];

  if (process.env.NEXT_PUBLIC_MOCK !== 'true') {
    records = await getCachedRecordPreviewList(date, 'personal');

    // QueryClient에 직접 넣어서 HydrationBoundary로 클라이언트에 전달
    queryClient.setQueryData(['records', 'preview', date, 'personal'], records);
  } else {
    records = createMockRecordPreviews(date);
  }

  return (
    <div className="-mt-4 sm:-mt-6 h-full transition-colors duration-300 dark:bg-[#121212] bg-[#FDFDFD]">
      <header className="-mx-4 sm:-mx-6 sticky top-0 z-50 backdrop-blur-md px-4 py-3 sm:p-6 flex items-center justify-between transition-colors duration-300 dark:bg-[#121212]/80 bg-white/80">
        <Back />
        <div className="flex flex-col items-center">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest leading-none mb-1 text-[#10B981]">
            RECORD OF
          </span>
          <span className="text-xs sm:text-sm font-bold dark:text-white text-itta-black">
            {date}
          </span>
        </div>
        <div className="w-6 sm:w-8" />
      </header>

      <div className="py-4 sm:py-6 pb-14 sm:pb-16">
        <HydrationBoundary state={dehydrate(queryClient)}>
          {process.env.NEXT_PUBLIC_MOCK === 'true' ? (
            <DailyDetailRecords
              memories={records}
              date={date}
              scope="personal"
            />
          ) : (
            <DailyDetailRecords date={date} scope="personal" />
          )}
        </HydrationBoundary>
        <DailyDetailFloatingActions date={date} />
      </div>
    </div>
  );
}
