'use client';

import { useEffect, useState } from 'react';
import Searchbar from '@/components/Searchbar';
import TagButton from '@/components/TagButton';
import SimpleMemo from './SimpleMemo';
import {
  Calendar,
  Clapperboard,
  Film,
  LineSquiggle,
  Music2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

// const CATEGORIES = [
//   { id: 'all', label: '전체' },
//   { id: 'theater', label: '연극' },
//   { id: 'musical', label: '뮤지컬' },
//   { id: 'concert', label: '일기/여행' },
//   { id: 'movie', label: '영화' },
//   { id: 'etc', label: '기타' },
// ];

export default function SideFilterbar() {
  // const [selectedCategory, setSelectedCategory] = useState('all');
  const pathname = usePathname();

  const pathSegments = pathname.split('/').filter(Boolean);
  // TODO: 임시 경로 기반 분기. 나중에는 페이지별 설정/props 기반으로
  // 사이드 필터바 노출 요소를 결정하도록 개선 필요.
  // /[userId]/records 및 그 하위 경로(/[userId]/records/[postId] 등)에서는
  // 필터/메모를 숨기기 위해 두 번째 세그먼트가 records인지 여부만 체크한다.
  const isRecordsPage =
    pathSegments.length >= 2 && pathSegments[1] === 'records';

  return (
    <div className="min-w-0 w-full h-full flex flex-col">
      <div className="h-full">
        <Searchbar placeholder="로그 검색하기" onCalendarClick={() => {}} />
        {!isRecordsPage && (
        <div className="whitespace-nowrap flex gap-2 md:gap-2.5 mt-3 md:mt-7 md:flex-wrap overflow-x-auto">
          <TagButton
            onClick={() => {}}
    
              className="flex justify-center items-center gap-1"
            >
              <Clapperboard
                size={16}
                color="var(--itta-point)"
                className="flex justify-center items-center gap-1"
              />
              연극
            </TagButton>
            <TagButton
              onClick={() => {}}
              className="flex justify-center items-center gap-1"
            >
              <Film size={16} color="var(--itta-point)" />
              연극
            </TagButton>
            <TagButton
              onClick={() => {}}
              className="flex justify-center items-center gap-1"
            >
              <Music2 size={16} color="var(--itta-point)" />
              뮤지컬
            </TagButton>
            <TagButton
              onClick={() => {}}
              className="flex justify-center items-center gap-1"
            >
              <Calendar size={16} color="var(--itta-point)" />
              일기/여행
            </TagButton>
            <TagButton
              onClick={() => {}}
              className="flex justify-center items-center gap-1"
            >
              <Clapperboard size={16} color="var(--itta-point)" />
              영화
            </TagButton>
            <TagButton
              onClick={() => {}}
              className="flex justify-center items-center gap-1"
            >
              <LineSquiggle size={16} color="var(--itta-point)" />
              기타
            </TagButton>
            {/* {CATEGORIES.map((category) => (
              <TagButton
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={
                  selectedCategory === category.id
                    ? 'bg-itta-point/80 text-white shadow-sm border-itta-point'
                    : 'hover:border-itta-point text-gray-700'
                }
              >
                {category.label}
              </TagButton>
            ))} */}
          </div>
        )}
      </div>

      {/* 기록 리스트 화면에서는 메모 카드도 숨김 */}
      {!isRecordsPage && (
        <div className="hidden md:block">
          <ResponsiveMemoContainer>
            <SimpleMemo />
          </ResponsiveMemoContainer>
        </div>
      )}
    </div>
  );
}

interface ResponsiveMemoContainerProps {
  children: React.ReactNode;
}

function ResponsiveMemoContainer({ children }: ResponsiveMemoContainerProps) {
  const [isWide, setIsWide] = useState<boolean | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsWide(window.innerWidth >= 1180);
    };

    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      className={cn(
        'min-w-0',
        // 초기 렌더에서는 넉넉하게, 이후 브레이크포인트 기준으로 조정
        isWide === null ? 'pb-24' : isWide ? 'pb-3.5' : 'pb-24',
      )}
    >
      {children}
    </div>
  );
}
