import DailyDetailRecords from '../../../../../components/DailyDetailRecords';
import DailyDetailFloatingActions from '@/app/(post)/_components/DailyDetailFloatingActions';
import Back from '@/components/Back';
import { QueryClient } from '@tanstack/react-query';
import { formatDateISO } from '@/lib/date';
import { createMockRecordPreviews } from '@/lib/mocks/mock';

interface MyMonthlyDetailPageProps {
  params: Promise<{ date: string }>;
}

export default async function MyDateDetailPage({
  params,
}: MyMonthlyDetailPageProps) {
  const { date } = await params;
  const selectedDate = date || formatDateISO();

  const queryClient = new QueryClient();

  // const records = await queryClient.fetchQuery(
  //   recordPreviewListOptions(selectedDate),
  // );

  const records = createMockRecordPreviews(date);

  // TODO: 서버로부터 데이터 받아와야 함
  const recordedDates = ['2025-12-20', '2025-12-21', '2025-12-15'];

  return (
    <div className="-mt-6 min-h-screen transition-colors duration-300 dark:bg-[#121212] bg-[#FDFDFD]">
      <header className="-mx-6 sticky top-0 z-50 backdrop-blur-md p-6 flex items-center justify-between transition-colors duration-300 dark:bg-[#121212]/80 bg-white/80">
        <Back />
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase tracking-widest leading-none mb-1 text-[#10B981]">
            RECORD OF
          </span>
          <span className="text-sm font-bold dark:text-white text-itta-black">
            {date}
          </span>
        </div>
        <div className="w-8" />
      </header>

      <div className="py-6">
        <DailyDetailRecords memories={records} />
        <DailyDetailFloatingActions date={date} recordedDates={recordedDates} />
      </div>
    </div>
  );
}
