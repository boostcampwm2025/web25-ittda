import DailyDetailFloatingActions from '@/app/(post)/_components/DailyDetailFloatingActions';
import DailyDetailRecords from '@/components/DailyDetailRecords';
import DailyDetailRecordsSkeleton from '@/components/DailyDetailRecordsSkeleton';
import ErrorHandlingWrapper from '@/components/ErrorHandlingWrapper';
import ErrorFallback from '@/components/ErrorFallback';
import { createMockRecordPreviews } from '@/lib/mocks/mock';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { recordPreviewListOptions } from '@/lib/api/records';

interface GroupDailyDetailDataProps {
  date: string;
  groupId: string;
}

export default async function GroupDailyDetailData({
  date,
  groupId,
}: GroupDailyDetailDataProps) {
  const queryClient = new QueryClient();

  if (process.env.NEXT_PUBLIC_MOCK === 'true') {
    queryClient.setQueryData(
      ['group', groupId, 'records', 'daily', date],
      createMockRecordPreviews(date),
    );
  } else {
    await queryClient.prefetchQuery(recordPreviewListOptions(date, 'groups', groupId));
  }

  return (
    <div className="p-4 sm:p-6 pb-14 sm:pb-16">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ErrorHandlingWrapper
          fallbackComponent={ErrorFallback}
          suspenseFallback={<DailyDetailRecordsSkeleton />}
        >
          <DailyDetailRecords date={date} scope="groups" groupId={groupId} />
        </ErrorHandlingWrapper>
      </HydrationBoundary>
      <DailyDetailFloatingActions date={date} groupId={groupId} />
    </div>
  );
}
