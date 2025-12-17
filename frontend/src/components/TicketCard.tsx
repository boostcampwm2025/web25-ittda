import Image from 'next/image';
import SemiCircle from './SemiCircle';
import { cn } from '@/lib/utils';

export interface TicketProps {
  title?: string;
  venue?: string;
  seat?: string;
  date?: string;
  time?: string;
  performers?: string;
  imageUrl?: string;
  accentColor?: string;
}

export default function TicketCard({
  title = '내가 까마귀였을 때',
  venue = '어딘가의 공연장',
  seat = '1층 B구역 3열 3번',
  date = '2024.12.11',
  time = '15:00',
  performers = '도끼든 소두곰, 노트북 병아리...',
  imageUrl = '/profile-ex.jpeg',
  accentColor = '#123c86',
}: TicketProps) {
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
      <div
        className={cn(
          'w-26.25 flex items-center justify-center rounded-tl-lg rounded-bl-lg',
        )}
        style={{ backgroundColor: accentColor }}
      >
        <Image alt="포스터" src={'/profile-ex.jpeg'} width={75} height={90} />
      </div>

      {/* 중앙 정보 영역 */}
      <div className="flex-col px-6 py-5">
        <h2 className="text-sm font-bold mb-3 text-itta-black">{title}</h2>
        <div className="flex flex-col justify-center items-start gap-1">
          <p className="text-xs text-itta-black">{venue}</p>
          <p className="text-xs text-itta-black">{seat}</p>
          <p className="text-xs text-itta-black truncate">{performers}</p>
        </div>
      </div>

      {/* 우측 날짜 영역 */}
      <div className="relative text-itta-black text-xs flex flex-col pl-3 pr-6 py-10 items-start justify-center border-l border-itta-gray2 border-dashed">
        <p>{date}</p>
        <p>{time}</p>
      </div>
    </div>
  );
}
