import MonthlyDetailRecords from '@/app/(post)/_components/MonthlyDetailRecords';
import MonthlyDetailRecordsSkeleton from '@/app/(post)/_components/MonthlyDetailRecordsSkeleton';
import ErrorHandlingWrapper from '@/components/ErrorHandlingWrapper';
import ErrorFallback from '@/components/ErrorFallback';
import { getMonthRange } from '@/lib/date';
import { createMockGroupDailyRecords } from '@/lib/mocks/mock';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { groupDailyRecordListOptions } from '@/lib/api/group';

interface GroupMonthlyDetailDataProps {
  groupId: string;
  month: string;
}

export default async function GroupMonthlyDetailData({
  groupId,
  month,
}: GroupMonthlyDetailDataProps) {
  const queryClient = new QueryClient();

  if (process.env.NEXT_PUBLIC_MOCK === 'true') {
    queryClient.setQueryData(
      ['group', groupId, 'records', 'daily', month],
      createMockGroupDailyRecords(),
    );
  } else {
    await queryClient.prefetchQuery(groupDailyRecordListOptions(groupId, month));
  }

  const { startDate, endDate } = getMonthRange(month);

  return (
    <div className="p-4 sm:p-6 pb-bottom-nav">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ErrorHandlingWrapper
          fallbackComponent={ErrorFallback}
          suspenseFallback={<MonthlyDetailRecordsSkeleton />}
        >
          <MonthlyDetailRecords
            groupId={groupId}
            month={month}
            routePath={`/group/${groupId}/detail`}
            viewMapRoutePath={`/group/${groupId}/map?start=${startDate}&end=${endDate}`}
          />
        </ErrorHandlingWrapper>
      </HydrationBoundary>
    </div>
  );
}
