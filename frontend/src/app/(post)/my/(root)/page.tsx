import MonthRecords from '@/app/(post)/_components/MonthRecords';
import { getCachedMyMonthlyRecordList } from '@/lib/api/my';
import { createMockMonthlyRecord } from '@/lib/mocks/mock';
import { MonthlyRecordList } from '@/lib/types/recordResponse';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';

export default async function MyRecordsPage() {
  let monthlyRecords: MonthlyRecordList[];
  const queryClient = new QueryClient();

  if (process.env.NEXT_PUBLIC_MOCK === 'true') {
    monthlyRecords = createMockMonthlyRecord();
  } else {
    const year = String(new Date().getFullYear());
    monthlyRecords = await getCachedMyMonthlyRecordList(year);

    // QueryClient에 직접 넣어서 HydrationBoundary로 클라이언트에 전달
    queryClient.setQueryData(['my', 'records', 'month', year], monthlyRecords);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {process.env.NEXT_PUBLIC_MOCK === 'true' ? (
        <MonthRecords monthRecords={monthlyRecords} cardRoute={'/my/month'} />
      ) : (
        <MonthRecords cardRoute={'/my/month'} />
      )}
    </HydrationBoundary>
  );
}
