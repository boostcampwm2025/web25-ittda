import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import SharedRecords from './_components/SharedRecords';
import { groupListOptions } from '@/lib/api/group';

interface SharedPageProps {
  searchParams: Promise<{ [key: string]: string }>;
}

export default async function SharedPage({ searchParams }: SharedPageProps) {
  const queryClient = new QueryClient();
  const params = await searchParams;
  const sortBy = params.sort;

  if (process.env.NEXT_PUBLIC_MOCK !== 'true') {
    await queryClient.prefetchQuery(groupListOptions());
  }

  return (
    <div className="w-full flex flex-col gap-6">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <SharedRecords searchParams={sortBy} />
      </HydrationBoundary>
    </div>
  );
}
