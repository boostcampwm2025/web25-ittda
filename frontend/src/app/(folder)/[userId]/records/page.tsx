'use client';

import DiaryPostShort from '@/components/DiaryPostShort';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchPostList } from '@/lib/api/posts';
import FloatingCreateButton from '@/components/FloatingCreateButton';

export default function HomePage() {
  const router = useRouter();
  const pathname = usePathname();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['posts'],
    queryFn: () => fetchPostList(),
    select: (res) => res.items,
  });

  if (!data || isLoading) {
    return <div>로딩중</div>;
  }

  return (
    <div className="relative w-full h-full">
      <section className="w-full h-full px-6 pb-5 overflow-y-auto">
        <div className="flex flex-col h-full w-full">
          {data.map((item) => (
            <DiaryPostShort
              post={item}
              key={item.id}
              onClick={() => {
                router.push(`${pathname}/${item.id}`);
              }}
            />
          ))}
          <div className="absolute left-3.75 top-8 w-[1.5px] bottom-0 bg-itta-gray2 pointer-events-none" />
        </div>
      </section>

      <FloatingCreateButton />
    </div>
  );
}
