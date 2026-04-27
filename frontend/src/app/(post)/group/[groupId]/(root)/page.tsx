import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { groupMonthlyRecordListOptions } from '@/lib/api/group';
import { recordPreviewListOptions } from '@/lib/api/records';
import { formatDateISO } from '@/lib/date';
import { Suspense } from 'react';
import GroupMainTabs from './_components/GroupMainTabs';

interface GroupPageProps {
  params: Promise<{ groupId: string }>;
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { groupId } = await params;
  const year = String(new Date().getFullYear());
  const today = formatDateISO();
  const queryClient = new QueryClient();

  if (process.env.NEXT_PUBLIC_MOCK !== 'true') {
    await Promise.all([
      queryClient.prefetchQuery(groupMonthlyRecordListOptions(groupId, year)),
      queryClient.prefetchQuery(recordPreviewListOptions(today, 'groups', groupId)),
    ]);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense>
        <GroupMainTabs groupId={groupId} />
      </Suspense>
    </HydrationBoundary>
  );
}
