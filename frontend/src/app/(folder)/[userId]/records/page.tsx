'use client';

import DiaryPostShort from '@/components/DiaryPostShort';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchPostList } from '@/lib/api/posts';
import FloatingCreateButton from '@/components/FloatingCreateButton';
import SideFilterbar from '@/app/(main)/_components/SideFilterbar';

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
    <div className="w-full bg-white h-full relative pb-8">
      <main className="flex w-full h-full">
        {/*리스트 */}
        <div className="relative flex-[3]">
          <div className="absolute inset-0 transition-transform duration-300 w-full">
            <div className="flex flex-col h-full w-full overflow-y-auto">
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
          </div>
        </div>

        {/* 사이드바 */}
        <aside className="hidden md:block w-[320px] h-full overflow-y-auto border-l border-itta-gray2 px-4.25 py-6.5">
          <SideFilterbar />
        </aside>
      </main>

      <FloatingCreateButton />
    </div>
  );
}
