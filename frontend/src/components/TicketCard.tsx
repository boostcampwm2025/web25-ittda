import Image from 'next/image';
import SemiCircle from './SemiCircle';

export default function TicketCard() {
  return (
    <div className="relative flex rounded-lg border box-content border-itta-gray2 bg-white overflow-visible">
      <SemiCircle
        direction="right"
        className="absolute -left-px top-1/2 -translate-y-1/2 z-10"
      />
      <SemiCircle
        direction="left"
        className="absolute -right-px top-1/2 -translate-y-1/2 z-10"
      />
      <SemiCircle
        direction="down"
        className="absolute -top-2.25 right-23 z-10"
      />
      <SemiCircle
        direction="up"
        className="absolute -bottom-2.25 right-23 z-10"
      />

      {/* 좌측 포스터 영역 */}
      <div className="w-26.25 bg-blue-900 flex items-center justify-center rounded-tl-lg rounded-bl-lg">
        <Image alt="포스터" src="/profile-ex.jpeg" width={75} height={90} />
      </div>

      {/* 중앙 정보 영역 */}
      <div className="flex-col px-6 py-5">
        <h2 className="text-sm font-bold mb-3 text-itta-black">
          내가 까마귀였을 때
        </h2>
        <div className="flex flex-col justify-center items-start gap-1">
          <p className="text-xs text-itta-black">어딘가의 공연장</p>
          <p className="text-xs text-itta-black">1층 B구역 3열 3번</p>
          <p className="text-xs text-itta-black truncate">
            도끼 든 소두곰, 노트북 병아리, 총 든 토끼
          </p>
        </div>
      </div>

      {/* 우측 날짜 영역 */}
      <div className="relative text-itta-black text-xs flex flex-col pl-3 pr-6 py-10 items-start justify-center border-l-1 border-itta-gray2 border-dashed">
        <p className="font-semibold">2024.12.11</p>
        <p>15:00</p>
      </div>
    </div>
  );
}
