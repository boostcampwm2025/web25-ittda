import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import SharedRecords from './_components/SharedRecords';
import SharedRecordsSkeleton from './_components/SharedRecordsSkeleton';
import ErrorHandlingWrapper from '@/components/ErrorHandlingWrapper';
import ErrorFallback from '@/components/ErrorFallback';
import { groupListOptions } from '@/lib/api/group';

interface SharedPageProps {
  searchParams: Promise<{ [key: string]: string }>;
}

export default async function SharedPage({ searchParams }: SharedPageProps) {
  const queryClient = new QueryClient();
  const params = await searchParams;
  const sortBy = params.sort;

  await queryClient.prefetchQuery(groupListOptions());

  return (
    <div className="w-full flex flex-col gap-6">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ErrorHandlingWrapper
          fallbackComponent={ErrorFallback}
          suspenseFallback={<SharedRecordsSkeleton />}
        >
          <SharedRecords searchParams={sortBy} />
        </ErrorHandlingWrapper>
      </HydrationBoundary>
    </div>
  );
}
