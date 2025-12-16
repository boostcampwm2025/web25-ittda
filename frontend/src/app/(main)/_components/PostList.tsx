'use client';

import DiaryPostShort from '@/components/DiaryPostShort';
import TicketCard from '@/components/TicketCard';

export default function PostList() {
  const dummyPosts = Array.from({ length: 10 }, (_, i) => i);

  return (
    <div className="flex flex-col h-full w-full">
      <div className="w-fit">
        <TicketCard />
      </div>
      <div className="relative flex-1">
        {dummyPosts.map((_, index) => (
          <DiaryPostShort key={index} onClick={() => {}} />
        ))}
        <div className="absolute left-5.75 top-8 w-[1.5px] bottom-0 bg-itta-gray2 pointer-events-none" />
      </div>
    </div>
  );
}
