import MonthlyDetailHeaderActions from '@/app/(post)/_components/MonthlyDetailHeaderActions';
import MonthlyDetailRecords from '@/app/(post)/_components/MonthlyDetailRecords';
import { getCachedGroupDailyRecordList } from '@/lib/api/group';
import { getMonthRange } from '@/lib/date';
import { createMockGroupDailyRecords } from '@/lib/mocks/mock';
import { DailyRecordList } from '@/lib/types/recordResponse';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';

interface GroupMonthlyDetailPageProps {
  params: Promise<{ month: string; groupId: string }>;
}

export default async function GroupMonthlyDetailPage({
  params,
}: GroupMonthlyDetailPageProps) {
  const { groupId, month } = await params;

  let dailyRecords: DailyRecordList[];
  const queryClient = new QueryClient();

  if (process.env.NEXT_PUBLIC_MOCK === 'true') {
    dailyRecords = createMockGroupDailyRecords();
  } else {
    dailyRecords = await getCachedGroupDailyRecordList(groupId, month);

    // QueryClient에 원본 데이터를 저장 (select 함수가 클라이언트에서 변환)
    queryClient.setQueryData(
      ['group', groupId, 'records', 'daily', month],
      dailyRecords,
    );
  }

  const { startDate, endDate } = getMonthRange(month);
  return (
    <div className="h-full transition-colors duration-300 dark:bg-[#121212] bg-[#FDFDFD]">
      <div className="py-3 px-4 sm:py-6 sm:px-6 sticky top-0 z-50 transition-colors duration-300 dark:bg-[#121212] bg-white">
        <header className="flex items-center justify-between">
          <MonthlyDetailHeaderActions month={month} title="Together archive" />
        </header>
      </div>

      <div className="p-4 sm:p-6 pb-28 sm:pb-40">
        <HydrationBoundary state={dehydrate(queryClient)}>
          {process.env.NEXT_PUBLIC_MOCK === 'true' ? (
            <MonthlyDetailRecords
              groupId={groupId}
              month={month}
              serverSideData={dailyRecords}
              routePath={`/group/${groupId}/detail`}
              viewMapRoutePath={`/group/${groupId}/map?start=${startDate}&end=${endDate}`}
            />
          ) : (
            <MonthlyDetailRecords
              groupId={groupId}
              month={month}
              serverSideData={dailyRecords}
              routePath={`/group/${groupId}/detail`}
              viewMapRoutePath={`/group/${groupId}/map?start=${startDate}&end=${endDate}`}
            />
          )}
        </HydrationBoundary>
      </div>
    </div>
  );
}
