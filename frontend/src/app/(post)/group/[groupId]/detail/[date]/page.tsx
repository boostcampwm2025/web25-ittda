import DailyDetailFloatingActions from '@/app/(post)/_components/DailyDetailFloatingActions';
import DailyDetailRecords from '@/components/DailyDetailRecords';
import DailyDetailRecordsSkeleton from '@/components/DailyDetailRecordsSkeleton';
import Back from '@/components/Back';
import ErrorHandlingWrapper from '@/components/ErrorHandlingWrapper';
import ErrorFallback from '@/components/ErrorFallback';
import { createMockRecordPreviews } from '@/lib/mocks/mock';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { recordPreviewListOptions } from '@/lib/api/records';

interface GroupDailyDetailPageProps {
  params: Promise<{ date: string; groupId: string }>;
}

export default async function GroupDailyDetailPage({
  params,
}: GroupDailyDetailPageProps) {
  const { date, groupId } = await params;
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
    <div className="h-full transition-colors duration-300 dark:bg-[#121212] bg-[#FDFDFD]">
      <header className="sticky top-0 z-50 backdrop-blur-md px-4 py-3 sm:p-6 flex items-center justify-between transition-colors duration-300 dark:bg-[#121212]/80 bg-white/80">
        <Back />
        <div className="flex flex-col items-center">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest leading-none mb-1 text-[#10B981]">
            RECORD OF
          </span>
          <span className="text-xs sm:text-sm font-bold dark:text-white text-itta-black">
            {date}
          </span>
        </div>
        <div className="w-6 sm:w-8" />
      </header>

      <div className="p-4 sm:p-6">
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
    </div>
  );
}
