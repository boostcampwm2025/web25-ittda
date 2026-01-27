import MonthlyDetailHeaderActions from '@/app/(post)/_components/MonthlyDetailHeaderActions';
import MonthlyDetailRecords from '@/app/(post)/_components/MonthlyDetailRecords';
import { getCachedMyDailyRecordList } from '@/lib/api/my';
import { createMockDailyRecord } from '@/lib/mocks/mock';
import { DailyRecordList } from '@/lib/types/recordResponse';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';

interface MyMonthlyDetailPageProps {
  params: Promise<{ month: string }>;
}

export default async function MyMonthlyDetailPage({
  params,
}: MyMonthlyDetailPageProps) {
  const { month } = await params;

  let dailyRecords: DailyRecordList[];
  const queryClient = new QueryClient();

  if (process.env.NEXT_PUBLIC_MOCK === 'true') {
    dailyRecords = createMockDailyRecord();
  } else {
    dailyRecords = await getCachedMyDailyRecordList(month);

    // QueryClient에 직접 넣어서 HydrationBoundary로 클라이언트에 전달
    queryClient.setQueryData(['my', 'records', 'daily', month], dailyRecords);
  }

  return (
    <div className="-mt-6 min-h-screen transition-colors duration-300 dark:bg-[#121212] bg-[#FDFDFD]">
      <div className="-mx-6 py-6 px-6 sticky top-0 z-50 transition-colors duration-300 dark:bg-[#121212] bg-white">
        <header className="flex items-center justify-between">
          <MonthlyDetailHeaderActions month={month} title="Memory archive" />
        </header>
      </div>

      <div className="py-6 pb-40">
        <HydrationBoundary state={dehydrate(queryClient)}>
          {process.env.NEXT_PUBLIC_MOCK === 'true' ? (
            <MonthlyDetailRecords
              month={month}
              serverSideData={dailyRecords}
              routePath="/my/detail"
              viewMapRoutePath={`my/map/month/${month}`}
            />
          ) : (
            <MonthlyDetailRecords
              month={month}
              routePath="/my/detail"
              viewMapRoutePath={`my/map/month/${month}`}
            />
          )}
        </HydrationBoundary>
      </div>
    </div>
  );
}
