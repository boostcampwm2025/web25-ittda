import MonthRecords from '@/app/(post)/_components/MonthRecords';
import { groupMonthlyRecordListOptions } from '@/lib/api/group';
import { createMockGroupMonthlyRecords } from '@/lib/mocks/mock';
import { MonthlyRecordList } from '@/lib/types/recordResponse';
import { QueryClient } from '@tanstack/react-query';

interface GroupYearPageProps {
  params: Promise<{ groupId: string; year: string }>;
}

export default async function GroupYearPage({ params }: GroupYearPageProps) {
  const { groupId, year } = await params;

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
          monthRecords={monthlyRecords}
          cardRoute={`/group/${groupId}/month`}
        />
      )}
    </>
  );
}
