import DailyDetailRecords from '../../../../../components/DailyDetailRecords';
import DailyDetailFloatingActions from '@/app/(post)/_components/DailyDetailFloatingActions';
import Back from '@/components/Back';
import { QueryClient } from '@tanstack/react-query';
import { formatDateISO } from '@/lib/date';
import { createMockRecordPreviews } from '@/lib/mocks/mock';
import { myDailyRecordedDatesOption } from '@/lib/api/my';

interface MyMonthlyDetailPageProps {
  params: Promise<{ date: string }>;
}

// mock 데이터를 위한 임시 유틸 함수
const getPastDate = (daysAgo: number) => {
  const date = new Date();
  // 현재 날짜에서 daysAgo만큼 차감
  date.setDate(date.getDate() - daysAgo);

  // YYYY-MM-DD 형식으로 변환 (로컬 시간 기준)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  console.log(`${year}-${month}-${day}`, year, month, day);
  return `${year}-${month}-${day}`;
};

export default async function MyDateDetailPage({
  params,
}: MyMonthlyDetailPageProps) {
  const { date } = await params;
  const selectedDate = date || formatDateISO();

  const queryClient = new QueryClient();

  // TODO: 내 기록함 타임라인 데이터 서버로부터 받아오기
  // const records = await queryClient.fetchQuery(
  //   recordPreviewListOptions(selectedDate),
  // );
  //
  const records = createMockRecordPreviews(date);

  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');

  let recordedDates: string[];
  if (process.env.NEXT_PUBLIC_MOCK === 'true') {
    recordedDates = [
      currentDate.toISOString(),
      getPastDate(1),
      getPastDate(2),
      getPastDate(5),
      getPastDate(7),
    ];
  } else {
    recordedDates = await queryClient.fetchQuery(
      myDailyRecordedDatesOption(year, month),
    );
  }

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
