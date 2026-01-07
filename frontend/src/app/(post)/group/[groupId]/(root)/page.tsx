import MonthRecords from '@/components/MonthRecords';

const GroupMonthRecordsMock = [
  {
    id: '2025-12',
    name: '2025년 12월',
    count: 12,
    latestTitle: '동지 팥죽과 따뜻한 밤',
    latestLocation: '우리집',
    coverUrl:
      'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: '2025-11',
    name: '2025년 11월',
    count: 8,
    latestTitle: '첫 눈 오던 날의 기록',
    latestLocation: '성수동 카페거리',
    coverUrl:
      'https://images.unsplash.com/photo-1418985991508-e47386d96a71?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: '2025-10',
    name: '2025년 10월',
    count: 15,
    latestTitle: '가을 단풍 여행',
    latestLocation: '서울숲',
    coverUrl:
      'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?auto=format&fit=crop&q=80&w=400',
  },
];

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
          monthRecords={GroupMonthRecordsMock}
          cardRoute={`/group/${groupId}/month`}
        />
      )}
    </>
  );
}
