import MonthRecords from '@/app/(post)/_components/MonthRecords';
import { createMockMonthlyRecord } from '@/lib/mocks/mock';

interface GroupYearPageProps {
  params: Promise<{ groupId: string; year: string }>;
}

export default async function GroupYearPage({ params }: GroupYearPageProps) {
  const { groupId, year } = await params;

  // const { data } = useQuery({
  //   queryKey: ['posts', year],
  //   queryFn: () => fetchPostList(year),
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
