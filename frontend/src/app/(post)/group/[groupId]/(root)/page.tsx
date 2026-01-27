import MonthRecords from '@/app/(post)/_components/MonthRecords';
import { groupMonthlyRecordListOptions } from '@/lib/api/group';
import { createMockGroupMonthlyRecords } from '@/lib/mocks/mock';
import { MonthlyRecordList } from '@/lib/types/recordResponse';
import { QueryClient } from '@tanstack/react-query';

interface GroupPageProps {
  params: Promise<{ groupId: string }>;
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { groupId } = await params;
  const year = String(new Date().getFullYear());

  let monthlyRecords: MonthlyRecordList[];

  if (process.env.NEXT_PUBLIC_MOCK === 'true') {
    monthlyRecords = createMockGroupMonthlyRecords();
  } else {
    const queryClient = new QueryClient();
    monthlyRecords = await queryClient.fetchQuery(
      groupMonthlyRecordListOptions(groupId, year),
    );
  }

  return (
    <>
      {groupId && (
        <MonthRecords
          groupId={groupId}
          monthRecords={monthlyRecords}
          cardRoute={`/group/${groupId}/month`}
        />
      )}
    </>
  );
}
