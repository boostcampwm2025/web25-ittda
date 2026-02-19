import MonthlyDetailHeaderActions from '@/app/(post)/_components/MonthlyDetailHeaderActions';
import MonthlyDetailRecords from '@/app/(post)/_components/MonthlyDetailRecords';
import MonthlyDetailRecordsSkeleton from '@/app/(post)/_components/MonthlyDetailRecordsSkeleton';
import ErrorHandlingWrapper from '@/components/ErrorHandlingWrapper';
import ErrorFallback from '@/components/ErrorFallback';
import { getMonthRange } from '@/lib/date';
import { createMockGroupDailyRecords } from '@/lib/mocks/mock';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { groupDailyRecordListOptions } from '@/lib/api/group';

interface GroupMonthlyDetailPageProps {
  params: Promise<{ month: string; groupId: string }>;
}

export default async function GroupMonthlyDetailPage({
  params,
}: GroupMonthlyDetailPageProps) {
  const { groupId, month } = await params;
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
    <div className="h-full transition-colors duration-300 dark:bg-[#121212] bg-[#FDFDFD]">
      <div className="py-3 px-4 sm:py-6 sm:px-6 sticky top-0 z-50 transition-colors duration-300 dark:bg-[#121212] bg-white">
        <header className="flex items-center justify-between">
          <MonthlyDetailHeaderActions month={month} title="Together archive" />
        </header>
      </div>

      <div className="p-4 sm:p-6 pb-28 sm:pb-40">
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
    </div>
  );
}
