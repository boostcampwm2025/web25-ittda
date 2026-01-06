import SharedRecords from './_components/SharedRecords';

const mySharedGroupsMock = [
  {
    id: 'g1',
    name: '우리 가족 추억함',
    members: 4,
    count: 24,
    latestTitle: '동지 팥죽 한 그릇',
    latestLocation: '우리집',
    updatedAt: 1734789600000,
    hasNotification: true,
    coverUrl:
      'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'g2',
    name: '성수동 맛집 탐방대',
    members: 3,
    count: 12,
    latestTitle: '드디어 가본 팝업 스토어',
    latestLocation: '성수동 카페거리',
    updatedAt: 1734782400000,
    hasNotification: false,
    coverUrl:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=600',
  },
];

export default function SharedPage() {
  // const { data } = useQuery({
  //   queryKey: ['posts'],
  //   queryFn: () => fetchPostList(),
  //   select: (res) => res.items,
  // });
  // const posts = data ?? [];

  return (
    <div className="w-full flex flex-col gap-6">
      <SharedRecords sharedRecords={mySharedGroupsMock} />
    </div>
  );
}
