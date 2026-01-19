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

  // Mock 모드에서는 서버 prefetch 스킵
  const isMockMode = process.env.NEXT_PUBLIC_MOCK === 'true';

  if (!isMockMode) {
    try {
      await queryClient.prefetchQuery(recordDetailOptions(recordId));
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
