'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchPostList } from '@/lib/api/posts';
import DiaryPostShort from '@/components/DiaryPostShort';
import PerformanceCard from '@/components/PerformanceCard';

const PERFORMANCES = [
  {
    id: '1',
    title: '내가 까마귀였을 때',
    venue: '어딘가의 공연장',
    date: '2024.12.11',
    time: '15:00',
    seat: '1층 B구역 3열 3번',
    performers: '도끼든 소두곰, 노트북 병아리...',
    description:
      'Lorem ipsum is simply dummy text of the printing and typesetting industry. Lorem ipsum has been the industrys standard dummy text ever since the 1500s.',
    imageUrl:
      'https://images.unsplash.com/photo-1761618291331-535983ae4296?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aGVhdGVyJTIwcGVyZm9ybWFuY2UlMjBzdGFnZXxlbnwxfHx8fDE3NjU4MTkwMTF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    tags: ['연극', '실험극', '독립'],
    accentColor: '#123c86',
  },
  {
    id: '2',
    title: '스타벅스 관차',
    venue: '공무원 광장 앞 광장 옆 광장',
    date: '2024.12.11',
    time: '18:46',
    seat: '자유석',
    performers: '모두',
    description:
      'Lorem ipsum is simply dummy text of the printing and typesetting industry. Lorem ipsum has been the industrys standard dummy text ever since the 1500s.',
    imageUrl:
      'https://images.unsplash.com/photo-1599746791393-f2811f61f896?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNpY2FsJTIwYnJvYWR3YXklMjB0aGVhdGVyfGVufDF8fHx8MTc2NTkwNDk2OHww&ixlib=rb-4.1.0&q=80&w=1080',
    tags: ['뮤지컬', '브로드웨이', '코미디'],
    accentColor: '#c73866',
  },
  {
    id: '3',
    title: '음악의 밤',
    venue: '콘서트 홀',
    date: '2024.12.15',
    time: '19:00',
    seat: '2층 A구역 5열 8번',
    performers: '심포니 오케스트라',
    description:
      'Lorem ipsum is simply dummy text of the printing and typesetting industry. Lorem ipsum has been the industrys standard dummy text ever since the 1500s.',
    imageUrl:
      'https://images.unsplash.com/photo-1583778080016-0d8ec4b537c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jZXJ0JTIwbXVzaWMlMjBwZXJmb3JtYW5jZXxlbnwxfHx8fDE3NjU4MjY1MTZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    tags: ['클래식', '오케스트라', '음악'],
    accentColor: '#2d5aa6',
  },
];

export default function PostList() {
    const { data } = useQuery({
      queryKey: ['posts'],
      queryFn: () => fetchPostList(),
      select: (res) => res.items,
    });
  const posts = data ?? [];

  return (
    <div className="flex flex-col h-full w-full space-y-6">
      <div className="flex-1 space-y-6">
        {PERFORMANCES.map((performance) => (
          <PerformanceCard key={performance.id} {...performance} />
        ))}
      </div>
      {/* <TicketCard /> */}
      {/* </div> */}
      <div className="flex-1 space-y-6">
        {posts.map((post) => (
          <div
            key={post.id}
            className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
          >
            <DiaryPostShort key={post.id} post={post} onClick={() => {}} />
            <div className="absolute left-3.75 top-8 w-[1.5px] bottom-4 bg-itta-gray2 pointer-events-none" />
          </div>
        ))}
      </div>
    </div>
  );
}
