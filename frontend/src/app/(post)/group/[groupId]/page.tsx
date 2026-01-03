import { Users } from 'lucide-react';
import GroupHeaderActions from '../_components/GroupHeaderActions';
import Image from 'next/image';
import MonthRecords from '@/components/MonthRecords';

const groupInfo = {
  name: '우리 가족 추억함',
  inviteCode: 'DLOG-FAMILY-99',
  members: [
    {
      id: 1,
      name: '나',
      avatar: '/profile-ex.jpeg',
    },
    {
      id: 2,
      name: '엄마',
      avatar: '/profile-ex.jpeg',
    },
    {
      id: 3,
      name: '아빠',
      avatar: '/profile-ex.jpeg',
    },
  ],
};

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
    <div className="w-full flex flex-col gap-6">
      <header className="sticky top-0 z-50 w-full inset-x-0 pb-6 pt-4 border-b transition-all duration-300 dark:bg-[#121212]/95 dark:border-white/5 bg-white/95 border-gray-50">
        <GroupHeaderActions groupInfo={groupInfo} />

        <div className="flex items-end justify-between px-1">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight dark:text-white text-itta-black">
              {groupInfo.name}
            </h2>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-[#10B981]">
              <Users className="w-3.5 h-3.5" strokeWidth={1.5} />
              {groupInfo.members.length}명의 가족 활동 중
            </div>
          </div>
          <div className="flex -space-x-2">
            {groupInfo.members.map((m) => (
              <Image
                key={m.id}
                src={m.avatar}
                width={50}
                height={50}
                className="w-8 h-8 rounded-full border-2 shadow-sm bg-white dark:border-[#121212] border-white"
                alt={m.name}
              />
            ))}
          </div>
        </div>
      </header>
      <>
        <div className="flex items-center justify-start px-1">
          <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
            기록 보관함
          </h3>
        </div>

        {groupId && (
          <MonthRecords
            monthRecords={GroupMonthRecordsMock}
            cardRoute={`/group/${groupId}/month`}
          />
        )}
      </>
    </div>
  );
}
