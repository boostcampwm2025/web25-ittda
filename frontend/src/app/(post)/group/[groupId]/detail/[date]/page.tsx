import DailyDetailFloatingActions from '@/app/(post)/_components/DailyDetailFloatingActions';
import DailyDetailRecords from '@/app/(post)/_components/DailyDetailRecords';
import DateDetailHeaderActions from '@/app/(post)/_components/DateDetailHeaderActions';
import { MemoryRecord } from '@/lib/types/post';

interface GroupDailyDetailPageProps {
  params: Promise<{ date: string; groupId: string }>;
}

export default async function GroupDailyDetailPage({
  params,
}: GroupDailyDetailPageProps) {
  const { date, groupId } = await params;

  const memories: MemoryRecord[] = [
    {
      id: '1',
      title: '성수동 팝업 스토어 나들이',
      createdAt: new Date().getTime(),
      customFields: [],
      fieldOrder: [
        'emotion',
        'photos',
        'location',
        'content',
        'rating',
        'tags',
      ],
      data: {
        date: date || '2025.12.21',
        time: '오후 2:30',
        content:
          '드디어 가보고 싶었던 팝업 스토어 방문! 웨이팅은 길었지만 굿즈들이 너무 귀여웠다.',
        photos: ['/profile-ex.jpeg'],
        emotion: { emoji: '🤩', label: '설렘' },
        tags: ['데이트', '성수', '주말'],
        location: '성수동 카페거리',
        rating: { value: 4.5, max: 5 },
        media: null,
        table: null,
      },
    },
    {
      id: '2',
      title: '동지 팥죽 한 그릇',
      createdAt: new Date().getTime(),
      customFields: [],
      fieldOrder: ['location', 'emotion', 'content', 'table', 'rating'],
      data: {
        date: date || '2025.12.21',
        time: '오후 5:10',
        content: '어머니가 직접 쑤어주신 팥죽. 달지 않고 담백해서 좋다.',
        photos: [],
        emotion: { emoji: '🥣', label: '따뜻해' },
        tags: ['가족', '겨울'],
        location: '우리집',
        rating: { value: 5, max: 5 },
        media: null,
        table: [
          ['재료', '평가'],
          ['새알심', '쫀득함'],
          ['팥소', '진함'],
        ],
      },
    },
  ];

  const currentMonth = date?.substring(0, 7);

  // TODO: 서버로부터 데이터 받아와야 함
  const recordedDates = ['2025-12-20', '2025-12-21', '2025-12-15'];

  return (
    <div className="min-h-screen transition-colors duration-300 dark:bg-[#121212] bg-[#FDFDFD]">
      <header className="-mx-6 sticky top-0 z-50 backdrop-blur-md p-6 flex items-center justify-between border-b transition-colors duration-300 dark:bg-[#121212]/80 dark:border-white/5 bg-white/80 border-gray-100">
        <DateDetailHeaderActions
          routePath={
            currentMonth
              ? `/group/${groupId}/month/${currentMonth}`
              : `/group/${groupId}`
          }
        />

        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase tracking-widest leading-none mb-1 text-[#10B981]">
            RECORD OF
          </span>
          <span className="text-sm font-bold dark:text-white text-itta-black">
            {date}
          </span>
        </div>
        <div className="w-8" />
      </header>

      <div className="py-6">
        <DailyDetailRecords memories={memories} />
        <DailyDetailFloatingActions
          date={date}
          groupId={groupId}
          recordedDates={recordedDates}
        />
      </div>
    </div>
  );
}
