'use client';

import Image from 'next/image';
import { ChevronLeft, Ellipsis, Footprints } from 'lucide-react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import type { PostListItem } from '@/lib/types/post';
import { useRouter } from 'next/navigation';

interface DiaryPostDetailProps {
  post: PostListItem;
  onBack?: VoidFunction;
}

export default function DiaryPostDetail({
  post,
  onBack,
}: DiaryPostDetailProps) {
  const eventDate = new Date(post.eventDate);
  // const created = new Date(post.createdAt);
  const router = useRouter();

  const day = eventDate.getDate();
  const time = eventDate.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const weekday = eventDate.toLocaleDateString('ko-KR', {
    weekday: 'long',
  });

  return (
    <>
      {onBack && (
        <Button
          variant="ghost"
          onClick={onBack}
          className="w-fit hover:bg-transparent relative"
        >
          <div className="flex justify-start items-center absolute left-2">
            <ChevronLeft className="w-5 h-5 text-itta-black shrink-0 mr-1" />
            <span>뒤로 돌아가기</span>
          </div>
        </Button>
      )}
      <article
        data-post={post.id}
        className="relative w-full bg-white p-5 pb-6"
      >
        {/* Header Section */}
        <section className="flex justify-start items-center gap-2 mb-2 relative">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-itta-black rounded-full absolute -left-2" />
            <p className="text-black pl-2.5">{day}</p>
          </div>
          <p
            className="text-gray-600 text-sm tracking-[-0.308px]"
            style={{ fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
          >
            {time}
          </p>
          <p className="text-gray-600 text-sm tracking-[-0.308px]">{weekday}</p>
        </section>

        {/* Title */}
        <h3
          className="font-semibold pl-3 text-black mb-1 tracking-[-0.352px]"
          style={{ fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
        >
          {post.title}
        </h3>

        {/* Location */}
        <section className="flex items-center gap-2 mb-4 pl-3">
          <div className="w-4.5 h-4.5 shrink-0">
            <Footprints
              size={16}
              color="var(--itta-point)"
              fill="var(--itta-point)"
            />
          </div>
          <p
            className="text-gray-600 text-sm tracking-[-0.308px]"
            style={{ fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
          >
            {post.address}
          </p>
        </section>

        {/* Content and Image Section */}
        <section className="flex-col gap-3 mb-4 pl-3">
          {/* Image */}
          <div className="w-full mb-2.5 max-w-sm shrink-0 rounded-[10px] overflow-hidden border border-[#f3f4f6]">
            <Image
              alt="게시글 대표"
              className="w-full h-full object-cover object-center"
              src={post.imageUrl || '/profile-ex.jpeg'}
              width={120}
              height={120}
            />
          </div>

          {/* Text Content - matches image height with ellipsis */}
          <div className="flex-1 min-w-0">
            <p className="text-black text-sm tracking-[-0.308px] leading-normal">
              {post.content}
            </p>
          </div>
        </section>

        {/* Hashtags */}
        <div
          className="flex text-xs tracking-[-0.264px] pl-3 font-semibold gap-1"
          style={{ fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
        >
          <span>
            <span className="text-itta-point">#</span>
            <span className="text-itta-black">커피 </span>
          </span>
          <span>
            <span className="text-itta-point">#</span>
            <span className="text-itta-black">말차 </span>
          </span>
          <span>
            <span className="text-itta-point">#</span>
            <span className="text-itta-black">카페</span>
          </span>
        </div>
        <div className="absolute left-3.75 top-8 w-[1.5px] bottom-0 bg-itta-gray2 pointer-events-none" />
      </article>

      <div className="w-full flex justify-end items-center px-5 pt-5">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost">
              <Ellipsis size={16} className="text-itta-black shrink-0" />
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

      <div className="w-full flex flex-col gap-4.5 px-5 py-4">
        <Button size="lg">로그 공유하기</Button>
        <button
          onClick={() => router.push('/create/diary-travel')}
          className="w-full text-sm py-6.5 rounded-[10px] border-itta-black border border-dashed bg-white text-itta-black cursor-pointer"
        >
          로그 추가하기
        </button>
      </div>
    </>
  );
}
