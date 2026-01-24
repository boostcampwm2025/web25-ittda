import DailyDetailFloatingActions from '@/app/(post)/_components/DailyDetailFloatingActions';
import DailyDetailRecords from '@/components/DailyDetailRecords';
import { ActiveMember } from '@/lib/types/group';
import Back from '@/components/Back';
import { formatDateISO } from '@/lib/date';
import { createMockRecordPreviews } from '@/lib/mocks/mock';

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

  // TODO: 그룹 기록함 타임라인 데이터 서버로부터 받아오기
  const records = createMockRecordPreviews(date);

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
        <DailyDetailFloatingActions date={date} groupId={groupId} />
      </div>
    </div>
  );
}
