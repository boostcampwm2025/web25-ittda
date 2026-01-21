import MonthRecords from '@/app/(post)/_components/MonthRecords';
import { myMonthlyRecordListOptions } from '@/lib/api/my';
import { createMockMonthlyRecord } from '@/lib/mocks/mock';
import { MonthRecord } from '@/lib/types/record';
import { MyMonthlyRecordListResponse } from '@/lib/types/recordResponse';
import { QueryClient } from '@tanstack/react-query';
import { convertMontRecords } from '../../_utils/convertMonthRecords';

export default async function MyRecordsPage() {
  let monthlyRecords: MyMonthlyRecordListResponse[];

  if (process.env.NEXT_PUBLIC_MOCK === 'true') {
    monthlyRecords = createMockMonthlyRecord();
  } else {
    const queryClient = new QueryClient();
    monthlyRecords = await queryClient.fetchQuery(myMonthlyRecordListOptions());
  }

  // API 응답을 MonthRecord 형태로 변환
  const monthRecords: MonthRecord[] = convertMontRecords(monthlyRecords);

  return <MonthRecords monthRecords={monthRecords} cardRoute={'/my/month'} />;
}
