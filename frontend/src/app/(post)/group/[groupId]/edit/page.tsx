import GroupEditClient from './_components/GroupEditClient';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { groupDetailOptions } from '@/lib/api/group';
import { redirect } from 'next/navigation';

interface GroupEditPageProps {
  params: Promise<{ groupId: string }>;
}

export default async function GroupEditPage({ params }: GroupEditPageProps) {
  const { groupId } = await params;

  const queryClient = new QueryClient();

  try {
    await queryClient.fetchQuery(groupDetailOptions(groupId));
  } catch (error: unknown) {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? (error as { code: string }).code
        : undefined;

    if (code === 'NOT_FOUND') redirect('/shared');
    if (code === 'FORBIDDEN') redirect(`/group/${groupId}`);
    throw error;
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <GroupEditClient groupId={groupId} />
    </HydrationBoundary>
  );
}
