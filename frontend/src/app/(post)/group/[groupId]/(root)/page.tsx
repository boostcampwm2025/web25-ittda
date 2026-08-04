import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { pastFeedInfiniteOptions } from '@/lib/api/records';
import { Suspense } from 'react';
import GroupMainTabs from './_components/GroupMainTabs';
import Coachmark from '@/components/Coachmark';
import { GROUP_DETAIL_COACHMARK_STEPS } from './_components/groupDetailCoachmarkSteps';

interface GroupPageProps {
  params: Promise<{ groupId: string }>;
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { groupId } = await params;
  const queryClient = new QueryClient();

  if (process.env.NEXT_PUBLIC_MOCK !== 'true') {
    await queryClient.prefetchInfiniteQuery(pastFeedInfiniteOptions(groupId));
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Coachmark flowKey="group-detail" steps={GROUP_DETAIL_COACHMARK_STEPS} />
      <Suspense>
        <GroupMainTabs groupId={groupId} />
      </Suspense>
    </HydrationBoundary>
  );
}
