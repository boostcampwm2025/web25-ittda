import MonthlyDetailHeaderActions from '@/app/(post)/_components/MonthlyDetailHeaderActions';
import MonthlyDetailRecords from '@/app/(post)/_components/MonthlyDetailRecords';
import { groupDailyRecordListOptions } from '@/lib/api/group';
import { createMockGroupDailyRecords } from '@/lib/mocks/mock';
import { DailyRecordList } from '@/lib/types/recordResponse';
import { QueryClient } from '@tanstack/react-query';

interface GroupMonthlyDetailPageProps {
  params: Promise<{ month: string; groupId: string }>;
}

export default async function GroupMonthlyDetailPage({
  params,
}: GroupMonthlyDetailPageProps) {
  const { groupId, month } = await params;

  let dailyRecords: DailyRecordList[];

  if (process.env.NEXT_PUBLIC_MOCK === 'true') {
    dailyRecords = createMockGroupDailyRecords();
  } else {
    const queryClient = new QueryClient();
    dailyRecords = await queryClient.fetchQuery(
      groupDailyRecordListOptions(groupId, month),
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-300 dark:bg-[#121212] bg-[#FDFDFD]">
      <div className="py-6 px-6 sticky top-0 z-50 transition-colors duration-300 dark:bg-[#121212] bg-white">
        <header className="flex items-center justify-between">
          <MonthlyDetailHeaderActions month={month} title="Together archive" />
        </header>
      </div>

      <div className="p-6 pb-40">
        <MonthlyDetailRecords
          serverSideData={dailyRecords}
          month={month}
          routePath={`/group/${groupId}/detail`}
          viewMapRoutePath={`/group/${groupId}/map/month/${month}`}
        />
      </div>
    </div>
  );
}
