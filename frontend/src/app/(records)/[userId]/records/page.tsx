'use client';

import DiaryPostShort from '@/components/DiaryPostShort';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Header from '@/components/Header';
import { useQuery } from '@tanstack/react-query';
import { fetchRecordList } from '@/lib/api/posts';

export interface DiaryPostData {
  id: number;
  title: string;
  date: string;
  time: string;
  day: string;
  location: string;
  content: string;
  images: string[];
  tags: string[];
}

const dummyData = {
  id: 101,
  title: '스타벅스 말차',
  date: '2025.12.11',
  time: '18:46',
  day: '수요일',
  location: '광주광역시 광산구 월곡동 어딘가',
  content: `Lorem Ipsum is simply dummy text of the printing and typesetting industry.
Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.

It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.`,
  images: ['/profile-ex.jpeg'],
  tags: ['커피', '말차', '카페'],
};

export default function HomePage() {
  const [post, setPost] = useState<DiaryPostData | null>();
  const dummyPosts: DiaryPostData[] = Array.from(
    { length: 10 },
    () => dummyData,
  );
  const router = useRouter();
  const pathname = usePathname();

  // const { data, isLoading, isError } = useQuery({
  //   queryKey: ['posts'],
  //   queryFn: () => fetchRecordList(),
  //   // items만 뽑아 쓰면 페이지가 편해짐
  //   select: (res) => res.items,
  // });
  // if (!data || isLoading) {
  //   return <div>로딩중</div>;
  // }
  return (
    <div className="w-full bg-white pb-10 h-full relative pb-8">
      <Header title="나의 기록 - 일기/여행" />
      <div className={`absolute transition-transform duration-300 w-full`}>
        <div className="flex flex-col h-full w-full overflow-y-auto">
          {dummyPosts.map((item, index) => (
            <DiaryPostShort
              post={item}
              key={index}
              onClick={() => {
                router.push(`${pathname}/${item.id}`);
              }}
            />
          ))}
          <div className="absolute left-3.75 top-8 w-[1.5px] bottom-0 bg-itta-gray2 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
