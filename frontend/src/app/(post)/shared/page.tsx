import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import SharedRecords from './_components/SharedRecords';
import { groupListOptions } from '@/lib/api/group';

export default async function SharedPage() {
  const queryClient = new QueryClient();

  if (process.env.NEXT_PUBLIC_MOCK !== 'true') {
    await queryClient.prefetchQuery(groupListOptions());
  }

  return (
    <div className="w-full flex flex-col gap-6">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <SharedRecords />
      </HydrationBoundary>
    </div>
  );
}
