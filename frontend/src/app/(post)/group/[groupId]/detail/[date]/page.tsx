import DailyDetailFloatingActions from '@/app/(post)/_components/DailyDetailFloatingActions';
import DailyDetailRecords from '@/components/DailyDetailRecords';
import { ActiveMember } from '@/lib/types/group';
import Back from '@/components/Back';
import { formatDateISO } from '@/lib/date';
import { QueryClient } from '@tanstack/react-query';
import { recordPreviewListOptions } from '@/lib/api/records';
import { RecordPreview } from '@/lib/types/recordResponse';
import { createMockRecordPreviews } from '@/lib/mocks/mock';
import { groupDailyRecordedDatesOption } from '@/lib/api/group';
import { getPastDate } from '@/lib/utils/time';

interface GroupDailyDetailPageProps {
  params: Promise<{ date: string; groupId: string }>;
}

const members: ActiveMember[] = [
  {
    recordId: '1',
    id: 1,
    name: '나',
    avatar: '/profile-ex.jpeg',
  },
  {
    recordId: '2',
    id: 2,
    name: '엄마',
    avatar: '/profile-ex.jpeg',
  },
  {
    recordId: '3',
    id: 3,
    name: '아빠',
    avatar: '/profile-ex.jpeg',
  },
  {
    recordId: '4',
    id: 4,
    name: '언니',
    avatar: '/profile-ex.jpeg',
  },
];

export default async function GroupDailyDetailPage({
  params,
}: GroupDailyDetailPageProps) {
  const { date, groupId } = await params;
  const selectedDate = date || formatDateISO();

  const queryClient = new QueryClient();

  // TODO: 그룹 기록함 타임라인 데이터 서버로부터 받아오기
  // group 일 때의 쿼리 파라미터 전달 필요
  // const records = await queryClient.fetchQuery(
  //   recordPreviewListOptions(selectedDate),
  // );

  const records = createMockRecordPreviews(date);

  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');

  let recordedDates: string[];
  if (process.env.NEXT_PUBLIC_MOCK === 'true') {
    recordedDates = [
      getPastDate(date, 0),
      getPastDate(date, 1),
      getPastDate(date, 2),
      getPastDate(date, 5),
      getPastDate(date, 7),
    ];
  } else {
    recordedDates = await queryClient.fetchQuery(
      groupDailyRecordedDatesOption(groupId, year, month),
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-300 dark:bg-[#121212] bg-[#FDFDFD]">
      <header className="sticky top-0 z-50 backdrop-blur-md p-6 flex items-center justify-between transition-colors duration-300 dark:bg-[#121212]/80 bg-white/80">
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

      <div className="p-6">
        <DailyDetailRecords memories={records} members={members} />
        <DailyDetailFloatingActions
          date={date}
          groupId={groupId}
          recordedDates={recordedDates}
        />
      </div>
    </div>
  );
}
