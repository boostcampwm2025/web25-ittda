'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Ellipsis, Footprints } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import Header from '@/components/Header';
import { useParams } from 'next/navigation';
import { fetchPostById } from '@/lib/api/posts';
import { useQuery } from '@tanstack/react-query';

export default function HomePage() {
  const params = useParams();
  const postId = params.postId as string;

  const {
    data: post,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['post', postId], // postId별로 캐싱
    queryFn: () => fetchPostById(postId),
    enabled: !!postId,
  });

  //TODO: 로딩 맟 에러 처리
  if (isLoading || !post)
    return <div className="p-10 text-center text-gray-500">로딩중 ...</div>;

  return (
    <div className="w-full bg-white pb-10 h-full">
      <Header title="나의 기록 - 일기/여행" />
      <article className="relative w-full px-6 py-4">
        <div className="absolute left-[31px] top-6 bottom-0 w-[1.5px] bg-gray-200 pointer-events-none" />
        <div className="relative pl-8">
          {/* 제목 */}
          <div className="relative flex items-center mb-1">
            <div className="absolute -left-[28px] top-2 w-2.5 h-2.5 bg-gray-800 rounded-full z-10" />

            <h3
              className="text-lg font-bold text-black tracking-tight"
              style={{ fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
            >
              {post.title}
            </h3>
          </div>

          {/* TODO : 날짜 + 요일에 맞게 유틸함수로 포맷팅 후 출력 */}
          <div className="flex items-center gap-2 mb-1 text-sm text-gray-500 font-medium">
            <span>{post.createdAt}</span>
          </div>

          {/* 위치 정보 */}
          <div className="flex items-center gap-1.5 mb-4">
            <Footprints size={14} className="text-green-500 fill-green-500" />
            <p className="text-xs text-gray-500 tracking-tight">
              {post.address}
            </p>
          </div>

          {/* TODO: 이미지 배열로 받는 버전으로 수정 */}
          {post.imageUrl && (
            <div className="w-full mb-3 overflow-hidden  relative">
              <div className="relative w-3/5 aspect-[4/3]">
                <Image
                  alt={post.title}
                  src={post.imageUrl}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
            </div>
          )}

          {/* 텍스트 본문 */}
          <div className="text-sm md:text-md text-itta-black whitespace-pre-wrap mb-4">
            {post.content}
          </div>

          {/* 태그 */}
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            {post.tags?.map((tag, index) => (
              <span key={index} className="flex items-center">
                <span className="text-green-600 mr-0.5">#</span>
                <span className="text-gray-700">{tag}</span>
              </span>
            ))}
          </div>

          {/*TODO: 해당 게시글 유저만 수정/삭제 보이게*/}
          <div className="flex justify-end mt-4 -mr-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost">
                  <Ellipsis size={18} className="text-itta-black shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="flex flex-col justify-start items-start pr-10"
              >
                <Button
                  variant="ghost"
                  className="hover:bg-transparent hover:text-current cursor-pointer"
                >
                  수정하기
                </Button>
                <Button
                  variant="ghost"
                  className="hover:bg-transparent hover:text-current cursor-pointer"
                >
                  삭제하기
                </Button>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </article>

      {/* 하단 액션 버튼 그룹 */}
      <div className="w-full flex flex-col gap-3 px-6 mt-6 items-center">
        <Button
          size="lg"
          className="w-full bg-gray-800 hover:bg-gray-900 text-white rounded-xl h-12 font-semibold text-base"
        >
          로그 공유하기
        </Button>
        <button className="w-full py-3 md:py-6.5 rounded-xl border-gray-800 border border-dashed font-semibold text-base">
          로그 추가하기
        </button>
      </div>
    </div>
  );
}
