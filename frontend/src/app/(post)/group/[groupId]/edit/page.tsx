import GroupEditClient from './_components/GroupEditClient';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { groupDetailOptions } from '@/lib/api/group';

interface GroupEditPageProps {
  params: Promise<{ groupId: string }>;
}

export default async function GroupEditPage({ params }: GroupEditPageProps) {
  const { groupId } = await params;

  const queryClient = new QueryClient();

  await queryClient.fetchQuery(groupDetailOptions(groupId));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <GroupEditClient groupId={groupId} />
    </HydrationBoundary>
  );
}
