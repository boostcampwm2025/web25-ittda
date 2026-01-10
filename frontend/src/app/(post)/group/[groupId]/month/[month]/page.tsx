import MonthlyDetailHeaderActions from '@/app/(post)/_components/MonthlyDetailHeaderActions';
import MonthlyDetailRecords from '@/app/(post)/_components/MonthlyDetailRecords';

const initialDays = [
  {
    date: '2025-12-21',
    dayName: '일',
    title: '엄마의 팥죽',
    emoji: '🥣',
    author: '엄마',
    count: 1,
    coverUrl:
      'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=600',
  },
  {
    date: '2025-12-18',
    dayName: '목',
    title: '성수동 카페 나들이',
    emoji: '☕',
    author: '나',
    count: 3,
    coverUrl:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=600',
  },
  {
    date: '2025-12-10',
    dayName: '수',
    title: '눈 내린 아침 산책',
    emoji: '❄️',
    author: '아빠',
    count: 1,
    coverUrl:
      'https://images.unsplash.com/photo-1418985991508-e47386d96a71?auto=format&fit=crop&q=80&w=600',
  },
];

interface GroupMonthlyDetailPageProps {
  params: Promise<{ month: string; groupId: string }>;
}

export default async function GroupMonthlyDetailPage({
  params,
}: GroupMonthlyDetailPageProps) {
  const { groupId, month } = await params;

  return (
    <div className="min-h-screen transition-colors duration-300 dark:bg-[#121212] bg-[#FDFDFD]">
      <div className="py-6 px-6 sticky top-0 z-50 transition-colors duration-300 dark:bg-[#121212] bg-white">
        <header className="flex items-center justify-between">
          <MonthlyDetailHeaderActions
            month={month}
            title="Together archive"
            backRoutePath={`/group/${groupId}`}
          />
        </header>
      </div>

      <div className="p-6 pb-40">
        <MonthlyDetailRecords
          dayRecords={initialDays}
          routePath={`/group/${groupId}/detail`}
          viewMapRoutePath={`/group/${groupId}/map/month/${month}`}
        />
      </div>
    </div>
  );
}
