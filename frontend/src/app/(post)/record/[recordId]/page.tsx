import RecordDetailHeaderActions from '../_components/RecordDetailHeaderActions';
import { MemoryRecord } from '@/lib/types/record';

interface RecordPageProps {
  params: Promise<{ recordId: string }>;
}

export default async function RecordPage({ params }: RecordPageProps) {
  const { recordId } = await params;
  // const { data } = useQuery({
  //   queryKey: ['posts'],
  //   queryFn: () => fetchPostList(),
  //   select: (res) => res.items,
  // });
  // const posts = data ?? [];

  const record: MemoryRecord = {
    id: recordId,
    title: '성수동 팝업 스토어 나들이',
    customFields: [],
    createdAt: new Date().getTime(),
    fieldOrder: [
      'date',
      'time',
      'photos',
      'emotion',
      'location',
      'rating',
      'media',
      'table',
      'content',
      'tags',
    ],
    data: {
      date: '2025.12.21',
      time: '오후 2:30',
      emotion: {
        emoji: '🤩',
        label: '설렘',
      },
      content: `드디어 가보고 싶었던 성수동 팝업 스토어를 방문했다! 웨이팅이 꽤 길었지만, 입구부터 꾸며진 조형물들이 너무 예뻐서 기다리는 시간이 지루하지 않았다.\n\n내부에는 이번 시즌 한정판 굿즈들이 가득했는데, 특히 키링이 너무 귀여워서 친구 선물까지 여러 개 구매했다.`,
      tags: ['데이트', '성수', '주말', '팝업'],
      rating: {
        value: 4.5,
        max: 5.0,
      },
      location: '서울 성수동 카페거리',
      photos: [
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800',
      ],
      media: {
        title: '주토피아 2',
        type: '영화',
        year: '2025',
        image:
          'https://images.unsplash.com/photo-1593085512500-5d55148d6f0d?auto=format&fit=crop&q=80&w=200',
      },
      table: [
        ['방문 장소', '만족도'],
        ['성수 팝업', '상'],
        ['카페 어니언', '중'],
        ['성수 감자탕', '최상'],
      ],
    },
  };

  return (
    <div className="-mt-6 min-h-screen transition-colors duration-300 dark:bg-[#121212] bg-[#FDFDFD]">
      <header className="-mx-6 sticky top-0 z-50 backdrop-blur-md p-6 flex items-center justify-between transition-colors duration-300 dark:bg-[#121212]/90 bg-white/90">
        <RecordDetailHeaderActions record={record} />
      </header>

      {/* <MonthRecords monthRecords={myMonthRecordsMock} cardRoute={'/my/month'} /> */}
    </div>
  );
}
