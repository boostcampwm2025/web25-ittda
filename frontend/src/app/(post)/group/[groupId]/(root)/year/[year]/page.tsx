import MonthRecords from '@/app/(post)/_components/MonthRecords';
import MonthRecordsSkeleton from '@/app/(post)/_components/MonthRecordsSkeleton';
import ErrorHandlingWrapper from '@/components/ErrorHandlingWrapper';
import ErrorFallback from '@/components/ErrorFallback';
import { createMockGroupMonthlyRecords } from '@/lib/mocks/mock';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { groupMonthlyRecordListOptions } from '@/lib/api/group';

interface GroupYearPageProps {
  params: Promise<{ groupId: string; year: string }>;
}

export default async function GroupYearPage({ params }: GroupYearPageProps) {
  const { groupId, year } = await params;
  const queryClient = new QueryClient();

  if (process.env.NEXT_PUBLIC_MOCK === 'true') {
    queryClient.setQueryData(
      ['group', groupId, 'records', 'month', year],
      createMockGroupMonthlyRecords(),
    );
  } else {
    await queryClient.prefetchQuery(
      groupMonthlyRecordListOptions(groupId, year),
    );
  }

  return (
    <>
      <div className="flex items-baseline gap-2">
        <span className="text-sm sm:text-base font-bold dark:text-white text-[#222]">
          {year}년
        </span>
        <span className="text-xs text-gray-400">월별 기록이에요</span>
      </div>
      {groupId && (
        <HydrationBoundary state={dehydrate(queryClient)}>
          <ErrorHandlingWrapper
            fallbackComponent={ErrorFallback}
            suspenseFallback={<MonthRecordsSkeleton />}
          >
            <MonthRecords
              groupId={groupId}
              cardRoute={`/group/${groupId}/month`}
            />
          </ErrorHandlingWrapper>
        </HydrationBoundary>
      )}
    </>
  );
}
