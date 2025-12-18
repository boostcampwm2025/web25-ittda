import type { PostListItem } from '@/lib/types/post';
import { Footprints } from 'lucide-react';
import Image from 'next/image';

interface DiaryPostShortProps {
  post?: PostListItem;
  onClick: VoidFunction;
  active?: boolean;
}

export default function DiaryPostShort({
  post,
  onClick,
  active = false,
}: DiaryPostShortProps) {
  const created = post ? new Date(post.createdAt) : new Date();

  const day = created.getDate(); // 10
  const time = created.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }); // 18:46
  const weekday = created.toLocaleDateString('ko-KR', {
    weekday: 'long',
  }); // 수요일

  return (
    <article
      className={[
        'relative w-full p-5 pb-1 cursor-pointer',
        active ? 'bg-gray-100' : 'bg-white hover:bg-gray-50',
      ].join(' ')}
      onClick={onClick}
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
        className="font-semibold pl-3 text-black mb-2 tracking-[-0.352px]"
        style={{ fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
      >
        {post?.title ?? '스타벅스 말차'}
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
          {post?.address ?? '광주광역시 광산구 월곡동 어딘가'}
        </p>
      </section>

      {/* Content and Image Section */}
      <section className="flex gap-3 mb-4 pl-3">
        {/* Text Content - matches image height with ellipsis */}
        <div className="flex flex-col flex-1 min-w-0 gap-3">
          <p
            className="text-black text-sm tracking-[-0.308px] leading-normal line-clamp-6"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 6,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {post?.content ??
              'Lorem Ipsum is simply dummy text of the printing and typesetting industry.'}
          </p>

          {/* Hashtags */}
          <div
            className="flex text-xs tracking-[-0.264px] font-semibold gap-1"
            style={{ fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
          >
            {post?.tags?.map((tag, index) => (
              <span key={`${post.id}-tag-${index}`}>
                <span className="text-itta-point"># </span>
                <span className="text-itta-black">{tag}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Image */}
        <div className="w-30 h-30 mb-2.5 shrink-0 rounded-[10px] overflow-hidden border border-[#f3f4f6]">
          <Image
            alt="게시글 대표"
            className="w-full h-full object-cover object-center"
            src={post?.imageUrl || '/profile-ex.jpeg'}
            width={120}
            height={120}
          />
        </div>
      </section>

      {/* Divider */}
    </article>
  );
}
