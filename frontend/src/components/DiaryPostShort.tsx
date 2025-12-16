import Image from 'next/image';

interface DiaryPostShortProps {
  onClick: VoidFunction;
}

export default function DiaryPostShort({ onClick }: DiaryPostShortProps) {
  return (
    <article
      className="relative w-full bg-white p-5 pb-6 cursor-pointer"
      onClick={onClick}
    >
      {/* Header Section */}
      <section className="flex justify-start items-center gap-2 mb-1">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-itta-black rounded-full" />
          <p className="text-black">10</p>
        </div>
        <p
          className="text-itta-gray3 text-sm tracking-[-0.308px]"
          style={{ fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
        >
          18:46
        </p>
        <p className="text-itta-gray3 text-sm tracking-[-0.308px]">수요일</p>
      </section>

      {/* Title */}
      <h3
        className="font-semibold pl-3 text-black mb-1 tracking-[-0.352px]"
        style={{ fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
      >
        스타벅스 말차
      </h3>

      {/* Location */}
      <section className="flex items-center gap-2 mb-4 pl-3">
        <div className="w-4.5 h-4.5 shrink-0">
          <Image
            alt="아이콘 자리"
            className="w-full h-full object-cover object-center overflow-hidden"
            src={'/profile-ex.jpeg'}
            width={18}
            height={18}
          />
        </div>
        <p
          className="text-itta-gray3 text-sm tracking-[-0.308px]"
          style={{ fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
        >
          광주광역시 광산구 월곡동 어딘가
        </p>
      </section>

      {/* Content and Image Section */}
      <section className="flex gap-3 mb-4 pl-3">
        {/* Text Content - matches image height with ellipsis */}
        <div className="flex-1 min-w-0">
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
            Lorem Ipsum is simply dummy text of the printing and typesetting
            industry. Lorem Ipsum has been the industrys standard dummy text
            ever since the 1500s, when an unknown printer took a galley of type
            and scrambled it to make a type specimen book.
          </p>
        </div>

        {/* Image */}
        <div className="w-30 h-30 shrink-0 rounded-[10px] overflow-hidden border border-[#f3f4f6]">
          <Image
            alt="게시글 대표"
            className="w-full h-full object-cover object-center"
            src={'/profile-ex.jpeg'}
            width={120}
            height={120}
          />
        </div>
      </section>

      {/* Divider */}

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
    </article>
  );
}
