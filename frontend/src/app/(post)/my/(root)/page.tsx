import MonthRecords from '@/app/(post)/_components/MonthRecords';
import { myMonthlyRecordListOptions } from '@/lib/api/my';
import { createMockMonthlyRecord } from '@/lib/mocks/mock';
import { MonthlyRecordList } from '@/lib/types/recordResponse';
import { QueryClient } from '@tanstack/react-query';

export default async function MyRecordsPage() {
  let monthlyRecords: MonthlyRecordList[];

  if (process.env.NEXT_PUBLIC_MOCK === 'true') {
    monthlyRecords = createMockMonthlyRecord();
  } else {
    const queryClient = new QueryClient();

    const year = String(new Date().getFullYear());
    monthlyRecords = await queryClient.fetchQuery(
      myMonthlyRecordListOptions(year),
    );
  }

  return <MonthRecords monthRecords={monthlyRecords} cardRoute={'/my/month'} />;
}
