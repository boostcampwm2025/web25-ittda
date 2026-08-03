import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import {
  pastFeedInfiniteOptions,
  recordPreviewListOptions,
} from '@/lib/api/records';
import { formatDateISO } from '@/lib/date';
import { Suspense } from 'react';
import GroupMainTabs from './_components/GroupMainTabs';
import Coachmark from '@/components/Coachmark';
import { GROUP_DETAIL_COACHMARK_STEPS } from './_components/groupDetailCoachmarkSteps';

interface GroupPageProps {
  params: Promise<{ groupId: string }>;
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { groupId } = await params;
  const today = formatDateISO();
  const queryClient = new QueryClient();

  if (process.env.NEXT_PUBLIC_MOCK !== 'true') {
    await Promise.all([
      queryClient.prefetchQuery(
        recordPreviewListOptions(today, 'groups', groupId),
      ),
      // RecordTimelineFeed로 전환되기 전까지 임시로 병행 사용(전환 단계 검증용).
      queryClient.prefetchInfiniteQuery(pastFeedInfiniteOptions(groupId)),
    ]);
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
