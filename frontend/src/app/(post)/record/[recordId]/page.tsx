import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { notFound } from 'next/navigation';
import { recordDetailOptions } from '@/lib/api/records';
import RecordDetailContent from '../_components/RecordDetailContent';
import type { ApiError } from '@/lib/utils/errorHandler';

interface RecordPageProps {
  params: Promise<{ recordId: string }>;
}

export default async function RecordPage({ params }: RecordPageProps) {
  const { recordId } = await params;

  const queryClient = new QueryClient();

  try {
    await queryClient.prefetchQuery(recordDetailOptions(recordId));
  } catch (error) {
    // 404 에러는 notFound 페이지로
    const apiError = error as ApiError;
    if (apiError.code === 'NOT_FOUND' || apiError.message?.includes('404')) {
      notFound();
      return;
    }
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RecordDetailContent recordId={recordId} />
    </HydrationBoundary>
  );
}
