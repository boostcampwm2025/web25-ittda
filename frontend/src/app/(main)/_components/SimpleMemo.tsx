import { Pin } from 'lucide-react';

export default function SimpleMemo() {
  return (
    <div className="bg-[#FFF2B4] relative border-itta-gray2 py-4.5 px-5.5 text-sm min-w-0 shadow-sm">
      <Pin
        size={20}
        color="#f70808"
        fill="#f70808"
        className="absolute right-1 -top-1 rotate-30"
      />
      <p
        className="max-w-full leading-normal line-clamp-4"
        style={{
          display: '-webkit-box',
          WebkitLineClamp: 4,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        여기는 오늘 작성한 메모를 출력하는 곳입니다. 여기는 오늘 작성한 메모를
        출력하는 곳입니다. 여기는 오늘 작성한 메모를 출력하는 곳입니다. 여기는
        오늘 작성한 메모를 출력하는 곳입니다.
      </p>
    </div>
  );
}
