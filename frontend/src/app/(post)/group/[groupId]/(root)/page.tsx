import MonthRecords from '@/app/(post)/_components/MonthRecords';
import { createMockMonthlyRecord } from '@/lib/mocks/mock';

interface GroupPageProps {
  params: Promise<{ groupId: string }>;
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { groupId } = await params;

  // const { data } = useQuery({
  //   queryKey: ['posts'],
  //   queryFn: () => fetchPostList(),
  //   select: (res) => res.items,
  // });
  // const posts = data ?? [];

  return (
    <>
      {groupId && (
        <MonthRecords
          monthRecords={createMockMonthlyRecord()}
          cardRoute={`/group/${groupId}/month`}
        />
      )}
    </>
  );
}
