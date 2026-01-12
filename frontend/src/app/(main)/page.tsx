import { MemoryRecord } from '@/lib/types/record';
import MonthlyPatternChart from './_components/MonthlyPatternChart';
import RecordList from './_components/RecordList';
import { formatDateISO } from '@/lib/date';
import WeekCalendar from './_components/WeekCalendar';

const allMockRecords: MemoryRecord[] = [
  {
    id: '1',
    title: '성수동 팝업 스토어 나들이',
    createdAt: Date.now(),
    customFields: [],
    fieldOrder: ['emotion', 'photos', 'location', 'content', 'rating', 'tags'],
    data: {
      date: formatDateISO().replace(/-/g, '.'),
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
    createdAt: Date.now(),
    customFields: [],
    fieldOrder: ['location', 'emotion', 'content', 'table', 'rating'],
    data: {
      date: formatDateISO().replace(/-/g, '.'),
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

export default function HomePage() {
  // const { data } = useQuery({
  //   queryKey: ['posts'],
  //   queryFn: () => fetchPostList(),
  //   select: (res) => res.items,
  // });
  // const posts = data ?? [];

  return (
    <>
      <WeekCalendar />
      <div className="flex-1 w-full p-5 space-y-6 pb-30 transition-colors duration-300 dark:bg-[#121212] bg-[#F9F9F9]">
        <div className="w-full flex flex-col gap-6">
          <MonthlyPatternChart />
          <RecordList records={allMockRecords} />
        </div>
      </div>
    </>
  );
}
