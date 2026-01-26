import MonthRecords from '@/app/(post)/_components/MonthRecords';
import { getCachedGroupMonthlyRecordList } from '@/lib/api/group';
import { createMockGroupMonthlyRecords } from '@/lib/mocks/mock';
import { MonthlyRecordList } from '@/lib/types/recordResponse';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';

interface GroupPageProps {
  params: Promise<{ groupId: string }>;
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { groupId } = await params;
  const year = String(new Date().getFullYear());

  let monthlyRecords: MonthlyRecordList[];
  const queryClient = new QueryClient();

  if (process.env.NEXT_PUBLIC_MOCK === 'true') {
    monthlyRecords = createMockGroupMonthlyRecords();
  } else {
    monthlyRecords = await getCachedGroupMonthlyRecordList(groupId, year);

    // QueryClient에 직접 넣어서 HydrationBoundary로 클라이언트에 전달
    queryClient.setQueryData(
      ['group', groupId, 'records', 'month', year],
      monthlyRecords,
    );
  }

  return (
    <>
      {groupId && (
        <HydrationBoundary state={dehydrate(queryClient)}>
          {process.env.NEXT_PUBLIC_MOCK === 'true' ? (
            <MonthRecords
              groupId={groupId}
              monthRecords={monthlyRecords}
              cardRoute={`/group/${groupId}/month`}
            />
          ) : (
            <MonthRecords
              groupId={groupId}
              cardRoute={`/group/${groupId}/month`}
            />
          )}
        </HydrationBoundary>
      )}
    </>
  );
}
