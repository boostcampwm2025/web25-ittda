import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { notFound } from 'next/navigation';
import { getCachedRecordDetail } from '@/lib/api/records';
import RecordDetailContent from '../_components/RecordDetailContent';
import type { ApiError } from '@/lib/utils/errorHandler';
import { RecordDetailResponse } from '@/lib/types/record';

interface RecordPageProps {
  params: Promise<{ recordId: string }>;
}

export default async function RecordPage({ params }: RecordPageProps) {
  const { recordId } = await params;

  const queryClient = new QueryClient();
  let record: RecordDetailResponse;

  if (process.env.NEXT_PUBLIC_MOCK === 'true') {
    try {
      record = await getCachedRecordDetail(recordId);

      // QueryClient에 직접 넣어서 HydrationBoundary로 클라이언트에 전달
      queryClient.setQueryData(['record', recordId], record);
    } catch (error) {
      // 404 에러는 notFound 페이지로
      const apiError = error as ApiError;
      if (apiError.code === 'NOT_FOUND' || apiError.message?.includes('404')) {
        notFound();
      }
    }
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RecordDetailContent recordId={recordId} />
    </HydrationBoundary>
  );
}
