import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import SharedRecords from './_components/SharedRecords';
import { getCachedGroupList } from '@/lib/api/group';
import { GroupSummary } from '@/lib/types/recordResponse';

interface SharedPageProps {
  searchParams: Promise<{ [key: string]: string }>;
}

export default async function SharedPage({ searchParams }: SharedPageProps) {
  const queryClient = new QueryClient();
  const params = await searchParams;
  const sortBy = params.sort;

  let initialGroups: GroupSummary[];

  if (process.env.NEXT_PUBLIC_MOCK !== 'true') {
    const groupList = await getCachedGroupList();
    initialGroups = groupList.items;

    // QueryClient에 직접 넣어서 HydrationBoundary로 클라이언트에 전달
    queryClient.setQueryData(['shared'], groupList.items);
  } else {
    initialGroups = [];
  }

  return (
    <div className="w-full flex flex-col gap-6">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <SharedRecords searchParams={sortBy} initialGroups={initialGroups} />
      </HydrationBoundary>
    </div>
  );
}
